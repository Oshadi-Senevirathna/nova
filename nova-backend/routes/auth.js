let express = require("express");
let bcrypt = require("bcryptjs");
let jwt = require("jsonwebtoken");
let nodemailer = require("nodemailer");
let { v4 } = require("uuid");

let {
  get_user_from_jwt_token_reset_pwd,
  check_policy,
} = require("../middleware/auth.js");
let dbAccess = require("../db_access/db_access.js");
let userLogs = require("../middleware/user_logs.js");
let {
  userSessionCreate,
  userSessionUpdate,
  userSessionClose,
} = require("../middleware/user_session.js");
let { on_data_update } = require("../middleware/web_socket.js");
let verify_session_user_privilege = require("../middleware/verify_session_user_privilege.js");

const router = express.Router();
const { ObjectId } = require("mongodb");
const { CLOSING } = require("ws");
const USER_COLLECTION = "users";

const SETTINGS_COLLECTION = "settings";
const SETTINGS_CATEGORY = "category";
const SETTINGS_EMAIL_SETTINGS = "email settings";

router.post("/authenticate", async (req, res) => {
  const request_data = req.body;
  if (!request_data.email || !request_data.pwd)
    return res.status(400).json({
      status: false,
      reason: "Not all fields have been entered",
    });

  console.log(`User authentication request recieved for ${request_data.email}`);

  try {
    const data = await dbAccess.getInstance(
      USER_COLLECTION,
      "email",
      request_data.email,
      true
    );
    var user = data.instance;
    console.log("Usercame", user);
    if (!user) {
      return res.status(400).json({
        status: false,
        reason: "Invalid email",
      });
    }

    const dataWindow = await dbAccess.getInstance(
      SETTINGS_COLLECTION,
      "instance_name",
      "password_retries_window",
      true
    );
    console.log("Came 1");
    const window = parseFloat(dataWindow.instance.value);
    const dataLockout = await dbAccess.getInstance(
      SETTINGS_COLLECTION,
      "instance_name",
      "password_lockout_time",
      true
    );
    console.log("Came 2");
    const lockout = parseFloat(dataLockout.instance.value);
    const dataCount = await dbAccess.getInstance(
      SETTINGS_COLLECTION,
      "instance_name",
      "password_retries_allowed",
      true
    );
    const count = parseFloat(dataCount.instance.value);
    console.log("Came 3");
    if (!lockout || !count || !window) {
      return res.status(400).json({
        status: false,
        reason: "Login policies not found",
      });
    }
    console.log("Came 4");
    const date = Date.now();
    const timeout = user.last_login_failure_time
      ? user.last_login_failure_time + window
      : 0;
    const locked = user.locked_time ? user.locked_time : 0;
    console.log("Came 6");
    if (date < locked) {
      return res.status(400).json({
        status: false,
        reason:
          "You exceeded the number of password retries. Please try again in a few minuites",
      });
    }
    console.log("Came 7");
    const isMatch = await bcrypt.compare(request_data.pwd, user.pwd.toString());
    if (!isMatch) {
      if (date > timeout) {
        (user.login_failure_count = 1), (user.last_login_failure_time = date);
      } else {
        user.login_failure_count = user.login_failure_count
          ? user.login_failure_count + 1
          : 1;
        if (user.login_failure_count >= count) {
          user.locked_time = date + lockout;
          user.last_login_failure_time = date - window;
        }
      }
      await dbAccess.replaceInstance(
        USER_COLLECTION,
        "UUID",
        user.UUID,
        user,
        ""
      );

      return res.status(400).json({
        status: false,
        reason: "Invalid password",
      });
    }
    console.log("Came 8");
    user.login_failure_count = 0;
    user.last_login_time = date;
    const results = await dbAccess.replaceInstance(
      USER_COLLECTION,
      "UUID",
      user.UUID,
      user,
      ""
    );
    console.log("Came 9");
    if (results.status !== true) return res.status(400).json(results);

    const token = jwt.sign(
      { user: user.instance_name },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_SECRET_EXPIRES_IN,
      }
    );
    console.log("Came 10");

    const session = await userSessionCreate(user["instance_name"]);
    console.log("Came 11");
    if (!session)
      return res.status(400).json({
        status: false,
        reason: "Maximum active sessions exceeded",
      });
    console.log("Came 12");
    if (user.instance_name === process.env.SUPER_ADMIN) {
      console.log("Came 13");
      const superadminTenantsTemp =
        await dbAccess.getFilteredAndSortedCollection("tenant");
      var superadminTenants = superadminTenantsTemp.instances;
      if (!superadminTenants) {
        user.tenants = [];
      } else {
        user.tenants = superadminTenants;
      }
      console.log("Came 14");
      const superadminPrivilegesTemp =
        await dbAccess.getFilteredAndSortedCollection("user_privileges");
      var superadminPrivileges = superadminPrivilegesTemp.instances;
      superadminPrivileges.push({
        instance_name: "manage_companies",
        display_name: "Manage Companies",
      });
      console.log("Came 15");
      if (!superadminPrivileges) {
        user.privileges = [];
      } else {
        user.privileges = superadminPrivileges;
      }
    } else {
      console.log("Came 16");
      const userRoles = user.roles;
      var userPrivileges = [];
      console.log("role", userRoles);
      console.log("Len", userRoles.length);
      for (let i = 0; i < userRoles.length; i++) {
        const userRoleTemp = await dbAccess.getInstance(
          "user_roles",
          "UUID",
          userRoles[i]
        );
        console.log("Role", userRoleTemp);
        if (userRoleTemp.instance.privileges) {
          for (let j = 0; j < userRoleTemp.instance.privileges.length; j++) {
            userPrivileges.push(userRoleTemp.instance.privileges[j]);
          }
        }
      }

      
      const allPrivilegesTemp = await dbAccess.getFilteredAndSortedCollection(
        "user_privileges"
      );
      var allPrivileges = allPrivilegesTemp.instances;

      const userPrivilegesObjects = [];
      for (let j = 0; j < allPrivileges.length; j++) {
        if (userPrivileges.indexOf(allPrivileges[j].UUID) > -1) {
          userPrivilegesObjects.push(allPrivileges[j]);
        }
      }
      console.log("here", userPrivilegesObjects);
      user.privileges = userPrivilegesObjects;
    }
    userLogs(user["instance_name"], "User login");

    user.pwd = "";

    res.status(200).json({
      status: true,
      jwt: token,
      session: session,
      reason: "",
      payload: user,
    });
  } catch (err) {
    res.status(500).json({ detail: "Error occured when finding user" });
  }
});

router.post("/logout", async (req, res) => {
  const validation = await verify_session_user_privilege(
    req.header("Session"),
    req.header("Authorization")
  );
  if (!validation.status) {
    return res.status(validation.errorCode).json({
      status: false,
      reason: validation.reason,
    });
  }
  const current_user = validation.current_user;

  try {
    await userSessionClose(req.body.session);
    userLogs(current_user, "User logout");

    res.status(200).json({
      status: true,
      reason: "",
    });
  } catch (err) {
    res.status(500).json({ detail: "Error occured when finding user" });
  }
});

router.post("/verify_user", async (req, res) => {
  const validation = await verify_session_user_privilege(
    req.header("Session"),
    req.header("Authorization"),
    USER_COLLECTION
  );
  if (!validation.status) {
    return res.status(validation.errorCode).json({
      status: false,
      reason: validation.reason,
    });
  }
  const current_user = validation.current_user;

  try {
    const data = await dbAccess.getInstance(
      USER_COLLECTION,
      "instance_name",
      current_user,
      true
    );
    const user = data.instance;
    if (!user) {
      return res.status(400).json({
        status: false,
        reason: "User not found in the system",
      });
    }

    if (user.instance_name === process.env.SUPER_ADMIN) {
      const superadminTenantsTemp =
        await dbAccess.getFilteredAndSortedCollection("tenant");
      var superadminTenants = superadminTenantsTemp.instances;
      if (!superadminTenants) {
        user.tenants = [];
      } else {
        user.tenants = superadminTenants;
      }
      const superadminPrivilegesTemp =
        await dbAccess.getFilteredAndSortedCollection("user_privileges");
      var superadminPrivileges = superadminPrivilegesTemp.instances;
      superadminPrivileges.push({
        instance_name: "manage_companies",
        display_name: "Manage Companies",
      });
      if (!superadminPrivileges) {
        user.privileges = [];
      } else {
        user.privileges = superadminPrivileges;
      }
    } else {
      const userRoles = user.roles;
      var userPrivileges = [];
      for (let i = 0; i < userRoles.length; i++) {
        const userRoleTemp = await dbAccess.getInstance(
          "user_roles",
          "UUID",
          userRoles[i]
        );
        if (userRoleTemp.instance.privileges) {
          for (let j = 0; j < userRoleTemp.instance.privileges.length; j++) {
            userPrivileges.push(userRoleTemp.instance.privileges[j]);
          }
        }
      }
      const allPrivilegesTemp = await dbAccess.getFilteredAndSortedCollection(
        "user_privileges"
      );
      var allPrivileges = allPrivilegesTemp.instances;

      const userPrivilegesObjects = [];
      for (let j = 0; j < allPrivileges.length; j++) {
        if (userPrivileges.indexOf(allPrivileges[j].UUID) > -1) {
          userPrivilegesObjects.push(allPrivileges[j]);
        }
      }
      user.privileges = userPrivilegesObjects;
    }

    res.status(200).json({
      status: true,
      jwt: req.header("Authorization"),
      session: req.header("Session"),
      reason: "",
      payload: user,
    });
  } catch (error) {
    res.status(404).json({ detail: "Error occured when accessing db" });
  }
});

router.get("/get_users", async (req, res) => {
  const validation = await verify_session_user_privilege(
    req.header("Session"),
    req.header("Authorization"),
    USER_COLLECTION
  );
  if (!validation.status) {
    return res.status(validation.errorCode).json({
      status: false,
      reason: validation.reason,
    });
  }

  try {
    const data = await dbAccess.getCollection(USER_COLLECTION);
    const users = data.instances;
    if (!users) {
      return res.status(400).json(data);
    }

    res.status(200).json({
      status: true,
      instances: users,
    });
  } catch (error) {
    res.status(404).json({ detail: "Error occured when accessing db" });
  }
});

router.post("/create_user", async (req, res) => {
  const validation = await verify_session_user_privilege(
    req.header("Session"),
    req.header("Authorization"),
    USER_COLLECTION,
    true
  );
  if (!validation.status) {
    return res.status(validation.errorCode).json({
      status: false,
      reason: validation.reason,
    });
  }
  const current_user = validation.current_user;

  const request_data = req.body;

  try {
    const data = await dbAccess.getInstance(
      USER_COLLECTION,
      "instance_name",
      request_data.instance_name,
      true
    );
    const user = data.instance;
    if (user) {
      return res.status(400).json({
        status: false,
        reason: "User already found in the system",
      });
    }

    const policyValidation = await check_policy(request_data.pwd);
    if (policyValidation)
      return res.status(400).json({
        status: false,
        reason: policyValidation,
      });
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(request_data.pwd, salt);
    request_data.pwd = passwordHash.toString("binary");

    const newId = v4();
    request_data["UUID"] = newId;

    const result = await dbAccess.insertInstance(
      USER_COLLECTION,
      request_data,
      current_user
    );
    if (result.status !== true) return res.status(400).json(result.reason);

    userLogs(
      current_user,
      "Create user",
      USER_COLLECTION,
      result.instance.instance_name,
      [result.instance]
    );
    const msg = {
      notification_type: "insert_entity_instance",
      payload: {
        entity_name: USER_COLLECTION,
      },
    };
    on_data_update(msg);

    res.status(200).json({
      status: true,
      UUID: newId,
      reason: "",
    });
  } catch (err) {
    res.status(500).json({ detail: "Error occured when adding user" });
  }
});

router.post("/update_user", async (req, res) => {
  const validation = await verify_session_user_privilege(
    req.header("Session"),
    req.header("Authorization"),
    USER_COLLECTION,
    true
  );
  if (!validation.status) {
    return res.status(validation.errorCode).json({
      status: false,
      reason: validation.reason,
    });
  }
  const current_user = validation.current_user;

  const request_data = req.body;
  console.log(`User update request recieved for"${request_data.instance_name}`);

  try {
    const data = await dbAccess.getInstance(
      USER_COLLECTION,
      "instance_name",
      request_data.instance_name,
      true
    );

    const user = data.instance;
    if (!user) {
      return res.status(400).json({
        status: false,
        reason: "User not found in the system",
      });
    }

    if (request_data.old_pwd && request_data.new_pwd) {
      const isMatch = await bcrypt.compare(
        request_data.old_pwd,
        user.pwd.toString()
      );
      if (!isMatch) {
        return res.status(400).json({
          status: false,
          reason: "Invalid old password",
        });
      }

      const policyValidation = await check_policy(request_data.new_pwd);
      if (policyValidation)
        return res.status(400).json({
          status: false,
          reason: policyValidation,
        });

      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(request_data.new_pwd, salt);
      request_data.pwd = passwordHash.toString("binary");
      delete request_data.old_pwd;
      delete request_data.new_pwd;
      console.log(request_data);
    }

    const result = await dbAccess.replaceInstance(
      USER_COLLECTION,
      "instance_name",
      request_data.instance_name,
      request_data,
      current_user
    );
    console.log(result);
    if (result.status !== true) return res.status(400).json(result.reason);

    userLogs(
      current_user,
      "Update instance",
      USER_COLLECTION,
      result.instance.instance_name,
      [result.instance]
    );
    const msg = {
      notification_type: "replace_entity_instance",
      payload: {
        entity_name: USER_COLLECTION,
        instances: [request_data.UUID],
      },
    };
    on_data_update(msg);

    console.log("end");

    res.status(200).json({
      status: true,
      reason: "",
    });
  } catch (err) {
    res.status(500).json({ detail: "Error occured when finding user" });
  }
});

// router.post("/reset_password", async (req, res) => {
//   const request_data = req.body;
//   try {
//     // Check if reset code is provided
//     if (!request_data.code) {
//       return res.status(400).json({
//         status: false,
//         reason: "Reset code not given",
//       });
//     }

//     // Validate the reset code and get the associated user
//     const current_user = get_user_from_jwt_token_reset_pwd(request_data.code);
//     if (!current_user) {
//       return res.status(400).json({
//         status: false,
//         reason: "Your token has either expired or is invalid",
//       });
//     }

//     // Check if new password is provided
//     if (!request_data.pwd) {
//       return res.status(400).json({
//         status: false,
//         reason: "Password not given",
//       });
//     }

//     console.log(`Reset password request received for ${current_user}`);

//     // Fetch user details from the database
//     const data = await dbAccess.getInstance(
//       USER_COLLECTION,
//       "instance_name",
//       current_user,
//       true
//     );
//     const user = data.instance;

//     if (!user) {
//       return res.status(400).json({
//         status: false,
//         reason: "User not found in the system",
//       });
//     }

//     // Check password policy
//     const policyValidation = await check_policy(request_data.pwd);
//     if (policyValidation) {
//       return res.status(400).json({
//         status: false,
//         reason: "Password policy validation failed",
//       });
//     }

//     // Hash and update the password
//     const salt = await bcrypt.genSalt();
//     const passwordHash = await bcrypt.hash(request_data.pwd, salt);
//     user.pwd = passwordHash.toString("binary");

//     // Update user in the database
//     const result = await dbAccess.replaceInstance(
//       USER_COLLECTION,
//       "instance_name",
//       current_user,
//       user,
//       current_user
//     );

//     if (result.status !== true) {
//       return res.status(400).json(result);
//     }

//     // Log user action and notify data update
//     userLogs(current_user, "Reset password", USER_COLLECTION, current_user, [
//       result.instance,
//     ]);
//     const msg = {
//       notification_type: "replace_entity_instance",
//       payload: {
//         entity_name: USER_COLLECTION,
//         UUID: user.UUID,
//       },
//     };
//     on_data_update(msg);

//     // Return success response
//     res.status(200).json({
//       status: true,
//       instance: user,
//       reason: "",
//     });
//   } catch (err) {
//     console.error(err);
//     res
//       .status(500)
//       .json({ detail: "Error occurred during password reset process" });
//   }
// });

router.post("/reset_password", async (req, res) => {
  const request_data = req.body;

  try {
    if (!request_data.code) {
      return res.status(400).json({
        status: false,
        reason: "Reset code not given",
      });
    }

    const current_user = get_user_from_jwt_token_reset_pwd(request_data.code);
    const extendedValidityPeriodInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (
      !current_user ||
      current_user.exp < Date.now() - extendedValidityPeriodInMs
    ) {
      return res.status(400).json({
        status: false,
        reason: "Your token has either expired or is invalid",
      });
    }

    if (!request_data.pwd) {
      return res.status(400).json({
        status: false,
        reason: "Password not given",
      });
    }

    console.log(`Reset password request received for ${current_user}`);

    const data = await dbAccess.getInstance(
      USER_COLLECTION,
      "instance_name",
      current_user,
      true
    );
    const user = data.instance;
    if (!user) {
      return res.status(400).json({
        status: false,
        reason: "User not found in the system",
      });
    }

    const policyValidation = await check_policy(request_data.pwd);
    if (policyValidation) {
      return res.status(400).json({
        status: false,
        reason: "Password policy validation failed",
      });
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(request_data.pwd, salt);
    user.pwd = passwordHash.toString("binary");

    const result = await dbAccess.replaceInstance(
      USER_COLLECTION,
      "instance_name",
      current_user,
      user,
      current_user
    );
    if (result.status !== true) {
      return res.status(400).json(result);
    }

    userLogs(current_user, "Reset password", USER_COLLECTION, current_user, [
      result.instance,
    ]);

    const msg = {
      notification_type: "replace_entity_instance",
      payload: {
        entity_name: USER_COLLECTION,
        UUID: user.UUID,
      },
    };
    on_data_update(msg);

    return res.status(200).json({
      status: true,
      instance: user,
      reason: "",
    });
  } catch (err) {
    console.error("Error occurred when resetting password:", err);
    return res.status(500).json({
      status: false,
      reason: "Error occurred when resetting password",
    });
  }
});

router.post("/forgot_password", async (req, res) => {
  const request_data = req.body;
  if (!request_data.username)
    return res.status(400).json({
      status: false,
      reason: "Username not given",
    });

  console.log(
    `Reset credentials request recieved for ${request_data.username}`
  );

  try {
    const data = await dbAccess.getInstance(
      USER_COLLECTION,
      "email",
      request_data.username,
      true
    );
    const user = data.instance;
    if (!user) {
      return res.status(400).json({
        status: false,
        reason: "No user is registered with this username",
      });
    }

    const data_1 = await dbAccess.getFilteredAndSortedCollection(
      SETTINGS_COLLECTION,
      [SETTINGS_CATEGORY],
      [SETTINGS_EMAIL_SETTINGS],
      [0]
    );
    const emailSettings = data_1.instances;
    if (!emailSettings) {
      return res.status(400).json({
        status: false,
        reason: "Password policies are not found",
      });
    }

    const emailSettingsMap = new Map();
    emailSettings.forEach(function (item) {
      emailSettingsMap.set(item.instance_name, item.value);
    });

    const transporter = nodemailer.createTransport({
      host: emailSettingsMap.get("email_host"),
      port: emailSettingsMap.get("email_port"),
      auth: {
        user: emailSettingsMap.get("email_host_user"),
        pass: emailSettingsMap.get("email_host_password"),
      },
    });

    console.log("URL", process.env.FRONTEND_URL);

    transporter.verify().then(console.log("Verified")).catch(console.error);

    const resetToken = jwt.sign(
      { user: user.instance_name },
      process.env.JWT_SECRET_PWD_RESET,
      {
        expiresIn: process.env.JWT_SECRET_PWD_RESET_EXPIRES_IN,
      }
    );

    console.log("Generated Reset Token:", resetToken);
    transporter
      .sendMail({
        from: `"Nova <${emailSettingsMap.get("email_host")}>`, // sender address
        to: `${user.email}`, // list of receivers
        subject: "Password reset request", // Subject line
        attachments: [
          {
            filename: "login-logo.png",
            path: __dirname + "/assets/login-logo.png",
            cid: "logo", //same cid value as in the html img src
          },
        ],
        html: `<p>A password reset request was made for your account. To reset your password, please click on the following link this link will expire after 5 mins:</p>
          <a href="http://localhost:3000/reset-password?code=${resetToken}">http://localhost:3000/reset-password?code=${resetToken}</a>
          <p>If this was not you, please ignore this email.</p>
          <br/><br/><br/>
          <img style="width:100px; float: left; margin-right: 10px;" src='cid:logo'/>
          <p>Powered by Nova</p>
          <br/><br/><br/>

          `,
      })
      .then((info) => {
        userLogs(
          user["instance_name"],
          `Password reset request made and email setn to ${user.email}`
        );
      })
      .catch(() => console.log("fail"));

    res.status(200).json({
      status: true,
      reason: "An email was sent to your account",
    });
  } catch (err) {
    res.status(500).json({ detail: "Error occured when finding user" });
  }
});

// router.post("/forgot_password", async (req, res) => {
//   const { username } = req.body;

//   try {
//     // Check if username is provided
//     if (!username) {
//        return res.status(400).json({
//         status: false,
//         reason: "Username not given",
//       });
//     }

//     // Fetch user details from the database
//     const userData = await dbAccess.getInstance(
//       USER_COLLECTION,
//       "email",
//       username,
//       true
//     );
//     const user = userData.instance;

//     // Check if user exists
//     if (!user) {
//       return res.status(400).json({
//         status: false,
//         reason: "No user is registered with this username",
//       });
//     }

//     // Fetch email settings from the database
//     const emailSettingsData = await dbAccess.getFilteredAndSortedCollection(
//       SETTINGS_COLLECTION,
//       [SETTINGS_CATEGORY],
//       [SETTINGS_EMAIL_SETTINGS],
//       [0]
//     );
//     const emailSettings = emailSettingsData.instances;

//     // Check if email settings are available
//     if (!emailSettings || emailSettings.length === 0) {
//       return res.status(400).json({
//         status: false,
//         reason: "Password policies are not found",
//       });
//     }

//     // Create a map of email settings for easier access
//     const emailSettingsMap = new Map();
//     emailSettings.forEach((item) => {
//       emailSettingsMap.set(item.instance_name, item.value);
//     });

//     // Create a nodemailer transporter
//     const transporter = nodemailer.createTransport({
//       host: emailSettingsMap.get("email_host"),
//       port: emailSettingsMap.get("email_port"),
//       auth: {
//         user: emailSettingsMap.get("email_host_user"),
//         pass: emailSettingsMap.get("email_host_password"),
//       },
//     });

//     // Verify transporter
//     await transporter.verify();

//     // Generate a reset token
//     const resetToken = jwt.sign(
//       { user: user.instance_name },
//       process.env.JWT_SECRET_PWD_RESET,
//       {
//         expiresIn: process.env.JWT_SECRET_PWD_RESET_EXPIRES_IN,
//       }
//     );

//     console.log("Generated Reset Token:", resetToken);

//     // Log the generated reset URL

//     const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password?code=${resetToken}`;
//     console.log("Reset Password URL:", resetPasswordURL);

//     // Send password reset email
//     await transporter.sendMail({
//       from: `"Nova <${emailSettingsMap.get("email_host")}>`,
//       to: `${user.email}`,
//       subject: "Password reset request",
//       html: `<p>A password reset request was made for your account. To reset your password, please click on the following link:</p>
//         <a href="${resetPasswordURL}">${resetPasswordURL}</a>
//         <p>If this was not you, please ignore this email.</p>
//         <br/><br/><br/>
//         <p>Powered by Nova</p>
//         <br/><br/><br/>`,
//     });

//     // Log the password reset request
//     userLogs(
//       user.instance_name,
//       `Password reset request made and email sent to ${user.email}`
//     );

//     // Send success response
//     res.status(200).json({
//       status: true,
//       reason: "An email was sent to your account",
//     });
//   } catch (err) {
//     console.error(err);
//     res
//       .status(500)
//       .json({ detail: "Error occurred during password reset process" });
//   }
// });

module.exports = router;
