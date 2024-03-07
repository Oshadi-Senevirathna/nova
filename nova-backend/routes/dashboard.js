let express = require("express");
let dbAccess = require("../db_access/db_access.js");
let dotenv = require("dotenv");
let groupInstances = require("../middleware/groupInstances.js");
let verify_session_user_privilege = require("../middleware/verify_session_user_privilege.js");

dotenv.config();
const router = express.Router();

router.get("/dashboard_device_os", async (req, res) => {
  const validation = await verify_session_user_privilege(
    req.header("Session"),
    req.header("Authorization"),
    "dashboard",
    "view"
  );
  if (!validation.status) {
    return res.status(validation.errorCode).json({
      status: false,
      reason: validation.reason,
    });
  }

  try {
    const data = await dbAccess.getCollection("device", false);
    var instances = data.instances;
    if (!instances) {
      return res.status(400).json(data);
    }

    const vals = groupInstances(instances, "os_version");
    var chartData = {};
    var series = [];
    var labels = [];
    for (const [key, value] of Object.entries(vals)) {
      labels.push(key);
      series.push(value.length);
    }
    chartData.series = series;
    chartData.labels = labels;

    res.set("access-control-allow-origin", "*");
    res.status(200).json({
      status: true,
      instances: chartData,
    });
  } catch (err) {
    res.status(500).json({ detail: "Error occured when accessing table" });
  }
});

router.get("/dashboard_device_status", async (req, res) => {
  const validation = await verify_session_user_privilege(
    req.header("Session"),
    req.header("Authorization"),
    "dashboard",
    "view"
  );
  if (!validation.status) {
    return res.status(validation.errorCode).json({
      status: false,
      reason: validation.reason,
    });
  }

  try {
    const data = await dbAccess.getCollection("device", false);
    var instances = data.instances;
    if (!instances) {
      return res.status(400).json(data);
    }

    const date = Date.now();
    const vals = groupInstances(instances, "last_active", [
      -1,
      date - 300000,
      date - 180000,
      date,
    ]);
    var chartData = {};
    var series = [];
    var labels = [];
    for (const [key, value] of Object.entries(vals)) {
      labels.push(key);
      series.push(value.length);
    }
    chartData.series = series;
    chartData.labels = labels;

    res.set("access-control-allow-origin", "*");
    res.status(200).json({
      status: true,
      instances: chartData,
    });
  } catch (err) {
    res.status(500).json({ detail: "Error occured when accessing table" });
  }
});

router.get("/dashboard_jobs_status", async (req, res) => {
  const validation = await verify_session_user_privilege(
    req.header("Session"),
    req.header("Authorization"),
    "frontend_job",
    "view"
  );
  if (!validation.status) {
    return res.status(validation.errorCode).json({
      status: false,
      reason: validation.reason,
    });
  }

  try {
    const data = await dbAccess.getCollection("frontend_jobs", false);
    var instances = data.instances;
    if (!instances) {
      return res.status(400).json(data);
    }
    console.log("Data Jobs", data);

    const date = Date.now();
    const vals = groupInstances(instances, "status", [
      "COMPLETED",
      "FAILED",
      "RUNNING",
      "PICKED",
    ]);
    var chartData = {};
    var series = [];
    var labels = [];
    for (const [key, value] of Object.entries(vals)) {
      labels.push(key);
      series.push(value.length);
    }
    chartData.series = series;
    chartData.labels = labels;

    res.set("access-control-allow-origin", "*");
    res.status(200).json({
      status: true,
      instances: chartData,
    });
  } catch (err) {
    res.status(500).json({ detail: "Error occured when accessing table" });
  }
});
router.get("/dashboard_job", async (req, res) => {
  const validation = await verify_session_user_privilege(
    req.header("Session"),
    req.header("Authorization"),
    "dashboard",
    "view"
  );
  if (!validation.status) {
    return res.status(validation.errorCode).json({
      status: false,
      reason: validation.reason,
    });
  }

  try {
    const data = await dbAccess.getCollection("frontend_jobs", false);
    var instances = data.instances;
    if (!instances) {
      return res.status(400).json(data);
    }

    const vals = groupInstances(instances, "status", [
      "COMPLETED",
      "FAILED",
      "ABORTED",
      "RUNNING",
    ]);
    var chartData = {};
    var series = [];
    var labels = [];

    for (const [key, value] of Object.entries(vals)) {
      labels.push(key);
      series.push(value.length);
    }
    chartData.series = series;
    chartData.labels = labels;
    chartData.vals = vals;

    res.set("access-control-allow-origin", "*");
    res.status(200).json({
      status: true,
      instances: chartData,
    });
  } catch (err) {
    res.status(500).json({ detail: "Error occured when accessing table" });
  }
});
router.get("/dashboard_job_byid", async (req, res) => {
  const entityName = req.query.entity_name;
  const uuid = req.query.UUID;
  console.log("ENTYA NAME", entityName);

  if (!entityName) {
    return res.status(400).json({
      status: false,
      reason: "Missing required data in the request",
    });
  }

  try {
    const data = await dbAccess.getJobsIds(entityName, uuid);
    var instances = data.instances;
    if (!instances) {
      return res.status(400).json(data);
    }

    res.status(200).json({
      status: true,
      instances: chartData,
    });
  } catch (err) {
    res.status(500).json({ detail: "Error occured when accessing table" });
  }
});
router.get("/dashboard_count", async (req, res) => {
  const entityName = req.query.entity_name;
  const findBy = req.query.findBy;
  const value = req.query.value;

  if (!entityName) {
    return res.status(400).json({
      status: false,
      reason: "Data missing in request",
    });
  }

  const validation = await verify_session_user_privilege(
    req.header("Session"),
    req.header("Authorization"),
    entityName,
    "view"
  );
  if (!validation.status) {
    return res.status(validation.errorCode).json({
      status: false,
      reason: validation.reason,
    });
  }

  console.log(`Request filtered instances of ${entityName}`);

  try {
    const data = await dbAccess.getCollectionCount(
      entityName,
      [findBy],
      [value],
      [0]
    );
    var count = data.count;
    if (!count) {
      return res.status(400).json(data);
    }

    res.set("access-control-allow-origin", "*");
    res.status(200).json({
      status: true,
      instances: count,
    });
  } catch (err) {
    res.status(500).json({ detail: "Error occured when accessing db" });
  }
});
router.get("/getTenantsByUser", async (req, res) => {
  // Extract necessary parameters from the request
  const entityName = req.query.entity_name;
  const userUUID = req.query.UUID;
  console.log("Received request with tenantUUID:", userUUID);
  console.log("Received request with entityname:", entityName);

  // Validate required parameters
  if (!entityName) {
    return res.status(400).json({
      status: false,
      reason: "Missing required data in the request",
    });
  }

  try {
    let tenantIds;

    tenantIds = await dbAccess.getTenantIdsByUser(entityName, userUUID);
    console.log("ids of tenants", tenantIds);

    if (tenantIds !== null) {
      res.status(200).json({
        status: true,
        tenantIds: tenantIds,
      });
    } else {
      // If no device IDs are found, return an empty array
      res.status(200).json({
        status: true,
        tenantIds: [],
      });
    }
  } catch (err) {
    console.error("Error accessing the database:", err);
    res.status(500).json({
      status: false,
      reason: "Error occurred when accessing the database",
    });
  }
});
//device routers
router.get("/dashboard_count_device_by_tenant", async (req, res) => {
  // Extract necessary parameters from the request
  const entityName = req.query.entity_name;
  const tenantUUID = req.query.tenant;
  console.log("Received request with tenantUUID:", tenantUUID);
  console.log("Received request with entityname:", entityName);

  // Validate required parameters
  if (!entityName) {
    return res.status(400).json({
      status: false,
      reason: "Missing required data in the request",
    });
  }

  // try {
  //   // Modify the database query to include tenantUUID conditionally
  //   let count;
  //   if (tenantUUID === "0") {
  //     // If tenantUUID is "0", fetch count for all devices
  //     count = await dbAccess.getDeviceCollectionCount(entityName);
  //   } else {
  //     // Otherwise, fetch count for the specified tenant
  //     count = await dbAccess.getDeviceCountByTenant(entityName, tenantUUID);
  //   }
  try {
    let count = await dbAccess.getDeviceCountAndIdsByTenant(
      entityName,
      tenantUUID
    );

    // Check if count is available
    if (count !== null) {
      // Respond with the count
      res.status(200).json({
        status: true,
        count: count,
      });
    } else {
      // If no devices are found, return the count as 0
      res.status(200).json({
        status: true,
        count: 0,
      });
    }
  } catch (err) {
    console.error("Error accessing the database:", err);
    res.status(500).json({
      status: false,
      reason: "Error occurred when accessing the database",
    });
  }
});
//getting device ids
router.get("/dashboard_device_ids_by_tenant", async (req, res) => {
  // Extract necessary parameters from the request
  const entityName = req.query.entity_name;
  const tenantUUID = req.query.tenant;
  console.log("Received request with tenantUUID:", tenantUUID);
  console.log("Received request with entityname:", entityName);

  // Validate required parameters
  if (!entityName) {
    return res.status(400).json({
      status: false,
      reason: "Missing required data in the request",
    });
  }

  try {
    // Modify the database query to include tenantUUID conditionally
    let deviceIds;
    if (tenantUUID === "0") {
      // If tenantUUID is "0", fetch all device IDs
      deviceIds = await dbAccess.getAllDeviceIds(entityName);
    } else {
      // Otherwise, fetch device IDs for the specified tenant
      deviceIds = await dbAccess.getDeviceIdsByTenant(entityName, tenantUUID);
    }

    // Check if device IDs are available
    if (deviceIds !== null) {
      // Respond with the device IDs
      res.status(200).json({
        status: true,
        deviceIds: deviceIds,
      });
    } else {
      // If no device IDs are found, return an empty array
      res.status(200).json({
        status: true,
        deviceIds: [],
      });
    }
  } catch (err) {
    console.error("Error accessing the database:", err);
    res.status(500).json({
      status: false,
      reason: "Error occurred when accessing the database",
    });
  }
});
//getting device names with device ids
router.get("/dashboard_device_names_by_deviceIds", async (req, res) => {
  // Extract necessary parameters from the request
  const entityName = req.query.entity_name;
  const deviceId = req.query.UUID;
  console.log("Received request with deviceId:", deviceId);
  console.log("Received request with entityname:", entityName);

  // Validate required parameters
  if (!entityName) {
    return res.status(400).json({
      status: false,
      reason: "Missing required data in the request",
    });
  }

  try {
    let devicenames = "";
    devicenames = await dbAccess.getDeviceNamesByDeviceIds(
      entityName,
      deviceId
    );
    console.log("Names", devicenames);
    // Check if device IDs are available
    if (devicenames !== null) {
      // Respond with the device IDs
      res.status(200).json({
        status: true,
        devicenames: devicenames,
      });
    } else {
      // If no device IDs are found, return an empty array
      res.status(200).json({
        status: true,
        devicenames: [],
      });
    }
  } catch (err) {
    console.error("Error accessing the database:", err);
    res.status(500).json({
      status: false,
      reason: "Error occurred when accessing the database",
    });
  }
});
router.get("/dashboard_device_names_by_deviceIds_jobs", async (req, res) => {
  const entityName = req.query.entity_name;
  const deviceId = req.query.UUID;
  console.log("Received request with deviceIdS:", deviceId);
  console.log("Received request with entityname:", entityName);

  if (!entityName) {
    return res.status(400).json({
      status: false,
      reason: "Missing required data in the request",
    });
  }
  try {
    const devicenames = await dbAccess.getDeviceNamesByDeviceIdsJobs(
      entityName,
      deviceId
    );

    if (devicenames.length > 0) {
      res.status(200).json({
        status: true,
        devicenames: devicenames,
      });
    } else {
      res.status(200).json({
        status: true,
        devicenames: [],
      });
    }
  } catch (err) {
    console.error("Error accessing the database:", err);
    res.status(500).json({
      status: false,
      reason: "Error occurred when accessing the database",
    });
  }
});

router.get("/dashboard_count_device_all", async (req, res) => {
  // Extract necessary parameters from the request
  const entityName = req.query.entity_name;

  // Validate required parameters
  if (!entityName) {
    return res.status(400).json({
      status: false,
      reason: "Missing required data in the request",
    });
  }

  try {
    // Fetch count for all devices
    const count = await dbAccess.getDeviceCollectionCount(entityName);

    // Check if count is available
    if (count !== null) {
      // Respond with the count
      res.status(200).json({
        status: true,
        count: count,
      });
    } else {
      // If no devices are found, return the count as 0
      res.status(200).json({
        status: true,
        count: 0,
      });
    }
  } catch (err) {
    console.error("Error accessing the database:", err);
    res.status(500).json({
      status: false,
      reason: "Error occurred when accessing the database",
    });
  }
});

router.get("/dashboard_count_device_all_jobs", async (req, res) => {
  // Extract necessary parameters from the request
  const entityName = req.query.entity_name;

  // Validate required parameters
  if (!entityName) {
    return res.status(400).json({
      status: false,
      reason: "Missing required data in the request",
    });
  }

  try {
    // Fetch count for all devices
    const count = await dbAccess.getDeviceCollectionCountForJobs(entityName);

    // Check if count is available
    if (count !== null) {
      // Respond with the count
      res.status(200).json({
        status: true,
        count: count,
      });
    } else {
      // If no devices are found, return the count as 0
      res.status(200).json({
        status: true,
        count: 0,
      });
    }
  } catch (err) {
    console.error("Error accessing the database:", err);
    res.status(500).json({
      status: false,
      reason: "Error occurred when accessing the database",
    });
  }
});

router.get("/dashboard_count_tenant_all", async (req, res) => {
  // Extract necessary parameters from the request
  const entityName = req.query.entity_name;
  const UUID = req.query.UUID;

  // Validate required parameters
  if (!entityName) {
    return res.status(400).json({
      status: false,
      reason: "Missing required data in the request",
    });
  }

  try {
    // Fetch count for all devices
    const count = await dbAccess.getTenantCollectionCount(entityName, UUID);

    // Check if count is available
    if (count !== null) {
      // Respond with the count
      res.status(200).json({
        status: true,
        count: count,
      });
    } else {
      // If no devices are found, return the count as 0
      res.status(200).json({
        status: true,
        count: 0,
      });
    }
  } catch (err) {
    console.error("Error accessing the database:", err);
    res.status(500).json({
      status: false,
      reason: "Error occurred when accessing the database",
    });
  }
});

router.get("/dashboard_count_tenant_all_superadmin", async (req, res) => {
  // Extract necessary parameters from the request
  const entityName = req.query.entity_name;

  // Validate required parameters
  if (!entityName) {
    return res.status(400).json({
      status: false,
      reason: "Missing required data in the request",
    });
  }

  try {
    // Fetch count for all devices
    const count = await dbAccess.getTenantCollectionCountAll(entityName);

    // Check if count is available
    if (count !== null) {
      // Respond with the count
      res.status(200).json({
        status: true,
        count: count,
      });
    } else {
      // If no devices are found, return the count as 0
      res.status(200).json({
        status: true,
        count: 0,
      });
    }
  } catch (err) {
    console.error("Error accessing the database:", err);
    res.status(500).json({
      status: false,
      reason: "Error occurred when accessing the database",
    });
  }
});
//getting job count using device ids
router.get("/jobs_by_device", async (req, res) => {
  const entityName = req.query.entity_name;
  const deviceIds = req.query.device_ids.split(",");
  console.log("Received request for jobs with device IDs:", deviceIds);

  // Validate  parameters
  if (!entityName || !deviceIds || deviceIds.length === 0) {
    return res.status(400).json({
      status: false,
      reason: "Missing or empty device IDs in the request",
    });
  }

  try {
    // Modify query to include the device IDs
    const jobs = await dbAccess.getJobsByDeviceIds(entityName, deviceIds);
    console.log("JOBS COUNT", jobs);
    // fetched jobs
    res.status(200).json({
      status: true,
      jobs: jobs,
    });
  } catch (err) {
    console.error("Error accessing the database or fetching jobs:", err);
    res.status(500).json({
      status: false,
      reason: "Error occurred when accessing the database or fetching jobs",
    });
  }
});
// router.get("/get_tenants", async (req, res) => {
//   const entityName = req.query.entity_name;
//   const UUID = req.query.UUID;
//   const unshaped = req.query.unshaped === "true" ? true : false;

//   console.log("uuid", UUID);

//   if (!entityName) {
//     return res.status(400).json({
//       status: false,
//       reason: "Data missing in request",
//     });
//   }

//   const validation = await verify_session_user_privilege(
//     req.header("Session"),
//     req.header("Authorization"),
//     entityName
//   );
//   if (!validation.status) {
//     return res.status(validation.errorCode).json({
//       status: false,
//       reason: validation.reason,
//     });
//   }

//   console.log(`Request roles of ${entityName}`);
//   try {
//     const tenantData = await dbAccess.getTenant(entityName, UUID);

//     if (!tenantData || !tenantData.status) {
//       return res.status(400).json({
//         status: false,
//         reason: "Tenant not found",
//       });
//     }

//     res.status(200).json(tenantData); // Return the entire response from getTenant
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ detail: "Error occurred when accessing db" });
//   }
//   // try {
//   //   const tenantData = await dbAccess.getTenant(entityName, UUID);

//   //   if (!tenantData) {
//   //     return res.status(400).json({
//   //       status: false,
//   //       reason: "Tenant not found",
//   //     });
//   //   }

//   //   res.status(200).json({
//   //     status: true,
//   //     tenants: tenantData,
//   //   });
//   // } catch (err) {
//   //   console.error(err);
//   //   res.status(500).json({ detail: "Error occurred when accessing db" });
//   // }
// });

//getting jobs count

// router.get("/dashboard_job_details", async (req, res) => {
//   const tenant = req.query.tenant ? req.query.tenant : undefined;
//   const companyOnly = req.query.company_only === "true" ? true : false;
//   const devices = req.query.devices ? req.query.devices.split(",") : [];

//   const validation = await verify_session_user_privilege(
//     req.header("Session"),
//     req.header("Authorization"),
//     undefined,
//     undefined,
//     tenant,
//     companyOnly
//   );

//   if (!validation.status) {
//     return res.status(validation.errorCode).json({
//       status: false,
//       reason: validation.reason,
//     });
//   }

//   try {
//     const data = await dbAccess.getFilteredAndSortedJobsCollection(
//       "frontend_jobs",
//       undefined,
//       undefined,
//       undefined,
//       undefined,
//       undefined,
//       undefined,
//       undefined,
//       undefined,
//       undefined,
//       undefined,
//       devices,
//       validation.tenants,
//       validation.users
//     );
//     var instances = data.instances;
//     if (!instances) {
//       return res.status(400).json(data);
//     }

//     const vals = groupInstances(instances, "status");
//     var chartData = {};
//     var series = [];
//     var labels = [];
//     for (const [key, value] of Object.entries(vals)) {
//       labels.push(key);
//       series.push(value.length);
//     }
//     chartData.series = series;
//     chartData.labels = labels;
//     chartData.vals = vals;

//     res.status(200).json({
//       status: true,
//       instances: chartData,
//     });
//   } catch (err) {
//     res.status(500).json({ detail: "Error occured when accessing table" });
//   }
// });
router.get("/get_tenants", async (req, res) => {
  const entityName = req.query.entity_name;
  const UUID = req.query.UUID;
  const unshaped = req.query.unshaped === "true" ? true : false;

  console.log("uuid", UUID);

  if (!entityName) {
    return res.status(400).json({
      status: false,
      reason: "Data missing in request",
    });
  }

  const validation = await verify_session_user_privilege(
    req.header("Session"),
    req.header("Authorization"),
    entityName
  );
  if (!validation.status) {
    return res.status(validation.errorCode).json({
      status: false,
      reason: validation.reason,
    });
  }

  console.log(`Request roles of ${entityName}`);
  try {
    const tenantData = await dbAccess.getTenant(entityName, UUID);

    if (!tenantData || !tenantData.status) {
      return res.status(400).json({
        status: false,
        reason: "Tenant not found",
      });
    }

    res.status(200).json(tenantData); // Return the entire response from getTenant
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Error occurred when accessing db" });
  }
});

router.post("/jobs_details_by_device_ids", async (req, res) => {
  try {
    // Extract data from the request body
    const entityName = req.body.entityName;
    const deviceIds = req.body.deviceIds;

    const jobDetails = await dbAccess.getJobDetailsByDeviceIds(
      entityName,
      deviceIds
    );
    console.log("All jobs get", jobDetails);

    res.status(200).json({
      status: true,
      jobDetails,
    });
  } catch (error) {
    console.error("Error in /jobs_details_by_device_ids:", error);
    res
      .status(500)
      .json({ detail: "Error occurred when fetching job details" });
  }
});

router.post("/jobs_details_by_device_All", async (req, res) => {
  try {
    // Extract data from the request body
    const entityName = req.body.entityName;

    const jobDetails = await dbAccess.getJobDetailsAll(entityName);
    console.log("All jobs get", jobDetails);

    res.status(200).json({
      status: true,
      jobDetails,
    });
  } catch (error) {
    console.error("Error in /jobs_details_by_device_all:", error);
    res
      .status(500)
      .json({ detail: "Error occurred when fetching job details all" });
  }
});

module.exports = router;
