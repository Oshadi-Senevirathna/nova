let mongoose = require("mongoose");
let dotenv = require("dotenv");
let check_collection_exist = require("../middleware/collection_exist.js");
let instanceDetails = require("../middleware/instance_details.js");
let reshape = require("../middleware/reshape.js");
let cleanDelete = require("../middleware/clean_delete.js");
let uniqueCheck = require("../middleware/unique_check.js");
let { ObjectID } = require("mongodb");

dotenv.config();
//all gets send reshaped data except for getinstance

class DBAccess {
  constructor() {
    this.db = null;
    this.privilegesMap = new Map();
    this.superAdmin = null;
    this.appAdmin = null;
  }

  connect() {
    mongoose
      .connect(process.env.DATABASE_ACCESS, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
      })
      .then(() => {
        this.getPrivileges();
        console.log("Connected to reader");
      })
      .catch((error) => console.log(`${error} did not connect`));
    mongoose.set("useFindAndModify", false);
    this.db = mongoose.connection;
  }

  // roles getting
  async getRoles(entity_name, unshaped) {
    try {
      if (entity_name !== "user_roles") {
        return {
          status: false,
          reason: "This function is only for retrieving roles",
        };
      }

      const collection_exist = check_collection_exist(entity_name);

      if (!collection_exist) {
        return { status: false, reason: "The roles collection doesn't exist" };
      }

      const results = [];
      const result = this.db.db.collection(entity_name).find();

      await result.forEach(function (item) {
        results.push(item);
      });

      if (unshaped !== true) {
        var filterDet = {};
        filterDet["entity_name"] = entity_name;
        const shape = await this.db.db
          .collection("collection_details")
          .findOne(filterDet);
        if (shape && results) {
          return reshape(shape, results);
        }
      }

      return { status: true, roles: results };
    } catch (error) {
      console.error(error);
      return {
        status: false,
        reason: "Was not able to access the roles collection in the database",
      };
    }
  }

  //get tenant
  // roles getting
  // async getTenant(entity_name, UUID, unshaped) {
  //   try {
  //     if (entity_name !== "users") {
  //       return {
  //         status: false,
  //         reason: "This function is only for retrieving tenants",
  //       };
  //     }

  //     const collection_exist = check_collection_exist(entity_name);

  //     if (!collection_exist) {
  //       return {
  //         status: false,
  //         reason: "The tenants collection doesn't exist",
  //       };
  //     }

  //     const results = [];
  //     const result = this.db.db.collection(entity_name).find({ UUID });

  //     await result.forEach(function (item) {
  //       results.push(item);
  //     });
  //     console.log("Results", results);
  //     if (unshaped !== true) {
  //       var filterDet = {};
  //       filterDet["entity_name"] = entity_name;
  //       const shape = await this.db.db
  //         .collection("collection_details")
  //         .findOne(filterDet);
  //       if (shape && results) {
  //         return reshape(shape, results);
  //       }
  //     }

  //     return { status: true, tenants: results };
  //   } catch (error) {
  //     console.error(error);
  //     return {
  //       status: false,
  //       reason: "Was not able to access the tenants collection in the database",
  //     };
  //   }
  // }
  // async getTenant function
  // async getTenant function
  async getTenant(entity_name, UUID, unshaped) {
    try {
      if (entity_name !== "users") {
        return {
          status: false,
          reason: "This function is only for retrieving tenants",
        };
      }

      const collection_exist = check_collection_exist(entity_name);

      if (!collection_exist) {
        return {
          status: false,
          reason: "The tenants collection doesn't exist",
        };
      }

      const results = [];
      const result = this.db.db
        .collection(entity_name)
        .find({ UUID: { $eq: UUID } });

      await result.forEach(function (item) {
        results.push({
          tenants: item.tenants,
        });
      });
      console.log("Results", results);

      if (unshaped !== true) {
        var filterDet = {};
        filterDet["entity_name"] = entity_name;
        const shape = await this.db.db
          .collection("collection_details")
          .findOne(filterDet);
        if (shape && results) {
          return reshape(shape, results);
        }
      }

      return { status: true, tenants: results };
    } catch (error) {
      console.error(error);
      return {
        status: false,
        reason: "Was not able to access the tenants collection in the database",
      };
    }
  }

  // Role names getting
  // async getRolesnames(entity_name, UUID, unshaped) {
  //   try {
  //     if (entity_name !== "user_roles") {
  //       return {
  //         status: false,
  //         reason: "This function is only for retrieving roles",
  //       };
  //     }

  //     const collection_exist = check_collection_exist(entity_name);

  //     if (!collection_exist) {
  //       return { status: false, reason: "The roles collection doesn't exist" };
  //     }

  //     const results = [];
  //     const result = this.db.db.collection(entity_name).find(UUID);

  //     await result.forEach(function (item) {
  //       results.push(item);
  //     });

  //     if (unshaped !== true) {
  //       var filterDet = {};
  //       filterDet["entity_name"] = entity_name;
  //       const shape = await this.db.db
  //         .collection("collection_details")
  //         .findOne(filterDet);
  //       if (shape && results) {
  //         return reshape(shape, results.instance_name);
  //       }
  //     }

  //     return { status: true, roles: results };
  //   } catch (error) {
  //     console.error(error);
  //     return {
  //       status: false,
  //       reason: "Was not able to access the roles collection in the database",
  //     };
  //   }
  // }
  async getRolesnames(entity_name, UUID) {
    try {
      if (entity_name !== "user_roles") {
        return {
          status: false,
          reason: "This function is only for retrieving roles",
        };
      }

      const collection_exist = check_collection_exist(entity_name);

      if (!collection_exist) {
        return { status: false, reason: "The roles collection doesn't exist" };
      }

      const role = await this.db.db.collection(entity_name).findOne({ UUID });

      if (!role) {
        return { status: false, reason: "Role with the given UUID not found" };
      }

      return { status: true, roleName: role.instance_name };
    } catch (error) {
      console.error(error);
      return {
        status: false,
        reason: "Was not able to access the roles collection in the database",
      };
    }
  }

  async getPrivileges() {
    try {
      const rolesTemp = await this.getCollection("user_roles", true);
      const allRoles = rolesTemp.instances;
      const privilegesTemp = await this.getCollection("user_privileges", true);
      const allPrivileges = privilegesTemp.instances;

      const privilegesMap = new Map();

      allPrivileges.forEach((privilege) => {
        var roleList = [];
        allRoles.forEach((role) => {
          if (role.privileges.indexOf(privilege.UUID) > -1) {
            roleList.push(role.UUID);
          }
        });
        privilegesMap.set(privilege.instance_name, roleList);
      });
      console.log(privilegesMap);
      this.privilegesMap = privilegesMap;
    } catch {
      return;
    }
  }
  async getCollection(entity_name, unshaped) {
    try {
      const collection_exist = check_collection_exist(entity_name);
      if (!collection_exist) {
        return { status: false, reason: "The collection doesn't exist" };
      }
      const results = [];
      const result = this.db.db.collection(entity_name).find();
      await result.forEach(function (item) {
        results.push(item);
      });

      if (unshaped !== true) {
        var filterDet = {};
        filterDet["entity_name"] = entity_name;
        const shape = await this.db.db
          .collection("collection_details")
          .findOne(filterDet);
        if (shape && results) {
          return reshape(shape, results);
        }
      }

      return { status: true, instances: results };
    } catch {
      return { status: false, reason: "Was not able to access the database" };
    }
  }
  // async getDeviceCountByTenant(entity_name, tenantUUID) {
  //   try {
  //     // Check  the collection exists
  //     const collectionExist = check_collection_exist(entity_name);
  //     if (!collectionExist) {
  //       // return null; //
  //       return { status: false, reason: "The collection doesn't exist" };
  //     }

  //     // Construct the filter to find devices by tenantUUID
  //     const filter = {
  //       tenant: tenantUUID,
  //     };

  //     // Use MongoDB aggregation pipeline to count the devices
  //     const count = await this.db.db
  //       .collection(entity_name)
  //       .countDocuments(filter);

  //     return count;
  //   } catch (error) {
  //     console.error("Error in getDeviceCountByTenant:", error);
  //     return null;
  //   }
  // }

  // async getDeviceCountAndIdsByTenant(entity_name, tenantUUID) {
  //   try {
  //     // Check if the collection exists
  //     const collectionExist = check_collection_exist(entity_name);
  //     if (!collectionExist) {
  //       return { status: false, reason: "The collection doesn't exist" };
  //     }

  //     // Construct the filter to find devices by tenantUUID
  //     const filter = {
  //       tenant: tenantUUID,
  //     };

  //     const devices = await this.db.db
  //       .collection(entity_name)
  //       .find(filter)
  //       .toArray();
  //     console.log("filter", filter);
  //     console.log("entity_name", entity_name);

  //     const deviceIds = devices.map((device) => device.UUID);

  //     const count = devices.length;

  //     return { count, deviceIds };
  //   } catch (error) {
  //     console.error("Error in getDeviceCountAndIdsByTenant:", error);
  //     return null;
  //   }
  // }
  async getDeviceCountAndIdsByTenant(entity_name, tenantUUID) {
    try {
      // Check if the collection exists
      const collectionExist = check_collection_exist(entity_name);
      if (!collectionExist) {
        return { status: false, reason: "The collection doesn't exist" };
      }

      // Split the comma-separated tenantUUID string into an array
      const tenantUUIDs = tenantUUID.split(",");

      // Construct the filter to find devices by tenantUUIDs using $in operator
      const filter = {
        tenant: { $in: tenantUUIDs },
      };

      const devices = await this.db.db
        .collection(entity_name)
        .find(filter)
        .toArray();

      console.log("filter", filter);
      console.log("entity_name", entity_name);

      const deviceIds = devices.map((device) => device.UUID);
      const count = devices.length;

      return { count, deviceIds };
    } catch (error) {
      console.error("Error in getDeviceCountAndIdsByTenant:", error);
      return null;
    }
  }

  async getFieldValues(entity_name, field) {
    try {
      const collection_exist = check_collection_exist(entity_name);
      if (!collection_exist) {
        return { status: false, reason: "The collection doesn't exist" };
      }

      /* const results = []; */
      const result = await this.db.db.collection(entity_name).distinct(field);
      /* await result.forEach(function (item) {
        results.push(item);
      }); */

      return { status: true, instances: result };
    } catch {
      return { status: false, reason: "Was not able to access the database" };
    }
  }
  async getCollectionSummary(entity_name) {
    try {
      const collection_exist = check_collection_exist(entity_name);
      if (!collection_exist) {
        return { status: false, reason: "The collection doesn't exist" };
      }
      const results = [];
      const result = this.db.db.collection(entity_name).find();
      await result.forEach(function (item) {
        var temp = {};
        temp.UUID = item.UUID;
        temp.instance_name = item.instance_name;
        results.push(temp);
      });

      return { status: true, instances: results };
    } catch {
      return { status: false, reason: "Was not able to access the database" };
    }
  }
  async getDeviceCollectionCount(entity_name) {
    try {
      const collection_exist = check_collection_exist(entity_name);
      if (!collection_exist) {
        return { status: false, reason: "The collection doesn't exist" };
      }

      const count = await this.db.db.collection(entity_name).countDocuments();

      return count;
    } catch {
      return { status: false, reason: "Was not able to access the database" };
    }
  }
  // async getDeviceCollectionCountForJobs(entity_name) {
  //   try {
  //     const collectionExist = check_collection_exist(entity_name);
  //     if (!collectionExist) {
  //       return { status: false, reason: "The collection doesn't exist" };
  //     }

  //     // Specify the criteria to target documents with non-empty device_id fields
  //     const query = {
  //       "arguments.device_id": { $exists: true, $ne: null },
  //     };

  //     // Use MongoDB countDocuments to count matching documents in the collection
  //     const count = await this.db.db
  //       .collection(entity_name)
  //       .countDocuments(query);

  //     return { status: true, count };
  //   } catch (error) {
  //     console.error("Error in getDeviceCollectionCount:", error);
  //     return { status: false, reason: "Error accessing the database" };
  //   }
  // }
  async getDeviceCollectionCountForJobs(entity_name) {
    try {
      const collectionExist = check_collection_exist(entity_name);
      if (!collectionExist) {
        return { status: false, reason: "The collection doesn't exist" };
      }

      // Specify the criteria to target documents with a non-null, non-missing, and non-"null" device_id fields
      const query = {
        "arguments.device_id": { $type: "string", $nin: [null, "null"] },
      };

      // Use MongoDB countDocuments to count matching documents in the collection
      const count = await this.db.db
        .collection(entity_name)
        .countDocuments(query);

      return { status: true, count };
    } catch (error) {
      console.error("Error in getDeviceCollectionCount:", error);
      return { status: false, reason: "Error accessing the database" };
    }
  }

  async getTenantCollectionCount(entity_name, userUUID) {
    try {
      const collectionExist = check_collection_exist(entity_name);
      if (!collectionExist) {
        return { status: false, reason: "The collection doesn't exist" };
      }

      // Construct the filter to find a user by UUID
      const filter = {
        UUID: userUUID,
      };

      // Use MongoDB findOne to get the user document for the specified UUID
      const user = await this.db.db.collection(entity_name).findOne(filter);

      // Check if the user exists
      if (!user) {
        return { status: false, reason: "User not found" };
      }

      // Count the number of tenants associated with the user
      const tenantCount = user.tenants.length;

      return { status: true, count: tenantCount };
    } catch (error) {
      console.error("Error in getTenantCollectionCount:", error);
      return { status: false, reason: "Error accessing the database" };
    }
  }
  async getTenantCollectionCountAll(entity_name) {
    try {
      const collection_exist = check_collection_exist(entity_name);
      if (!collection_exist) {
        return { status: false, reason: "The collection doesn't exist" };
      }

      const count = await this.db.db.collection(entity_name).countDocuments();

      return count;
    } catch {
      return { status: false, reason: "Was not able to access the database" };
    }
  }
  // async getTenantCollectionCount(entity_name, userUUID) {
  //   try {
  //     const collection_exist = check_collection_exist(entity_name);
  //     if (!collection_exist) {
  //       return { status: false, reason: "The collection doesn't exist" };
  //     }
  //     const filter = {
  //       UUID: userUUID,
  //     };

  //     const count = await this.db.db
  //       .collection(entity_name)
  //       .find(filter)
  //       .countDocuments();

  //     return count;
  //   } catch {
  //     return { status: false, reason: "Was not able to access the database" };
  //   }
  // }
  //getting all the device id
  async getAllDeviceIds(entity_name) {
    try {
      // Check if the collection exists
      const collectionExist = check_collection_exist(entity_name);
      if (!collectionExist) {
        // Return null or an empty array
        return [];
      }

      // Use MongoDB find to get all device IDs
      const devices = await this.db.db
        .collection(entity_name)
        .find({}, { projection: { UUID: 1 } })
        .toArray();
      const deviceIds = devices.map((device) => device.UUID.toString()); // Assuming _id is ObjectId
      return deviceIds;
    } catch (error) {
      console.error("Error in getAllDeviceIds:", error);
      return []; // or you can return null or throw an error
    }
  }
  async getDeviceIdsByTenant(entity_name, tenantUUID) {
    try {
      // Check if the collection exists
      const collectionExist = check_collection_exist(entity_name);
      if (!collectionExist) {
        // Return null or an empty array
        return [];
      }

      // Construct the filter to find devices by tenantUUID
      const filter = {
        tenant: tenantUUID,
      };

      // Use MongoDB find to get device IDs for the specified tenant
      const devices = await this.db.db
        .collection(entity_name)
        .find(filter, { projection: { UUID: 1 } })
        .toArray();
      const deviceIds = devices.map((device) => device.UUID.toString()); // Assuming _id is ObjectId
      return deviceIds;
    } catch (error) {
      console.error("Error in getDeviceIdsByTenant:", error);
      return []; // or you can return null or throw an error
    }
  }
  async getTenantIdsByUser(entity_name, userUUID) {
    try {
      const collectionExist = check_collection_exist(entity_name);
      if (!collectionExist) {
        return [];
      }

      const filter = {
        UUID: userUUID,
      };

      const user = await this.db.db.collection(entity_name).findOne(filter);

      if (!user || !user.tenants) {
        return [];
      }

      const tenantIds = user.tenants.map((tenant) => tenant.UUID.toString());
      console.log("tenant ids", tenantIds);
      return tenantIds;
    } catch (error) {
      console.error("Error in getTenantIdsByUser:", error);
      return [];
    }
  }

  async getJobsCountByDeviceIds(entity_name, deviceIds) {
    console.log("Received request for jobs with device IDs:", deviceIds);
    console.log("Name", entity_name);
    try {
      // Check if the collection exists
      const collectionExists = await this.db.db
        .listCollections({ name: entity_name })
        .hasNext();
      if (!collectionExists) {
        return { status: false, reason: "The collection doesn't exist" };
      }
      let totalCount = 0;
      const cursor = await this.db.db.collection(entity_name).find();

      let document;
      while ((document = await cursor.next())) {
        // Check if document has arguments and device_id property

        if (document.arguments && document.arguments.device_id) {
          // const deviceIdFromDB = document.arguments.device_id.toString();
          const deviceIdFromDB = document.arguments.device_id;
          const deviceIdFromFrontend = deviceIds.find(
            (id) => id === deviceIdFromDB
          );
          if (deviceIdFromFrontend) {
            console.log("Match found for Device ID:", deviceIdFromDB);
            totalCount++;
          }
        }
      }

      console.log("Total Job Count:", totalCount);
      return totalCount;
    } catch (error) {
      console.error("Error in getJobsCountByDeviceIds:", error);
      return null;
    }
  }
  //getting the selected jobs
  // async getJobsByDeviceIds(entity_name, deviceIds) {
  //   try {
  //     // Check if the collection exists
  //     const collectionExists = await this.db.db
  //       .listCollections({ name: entity_name })
  //       .hasNext();
  //     if (!collectionExists) {
  //       return { status: false, reason: "The collection doesn't exist" };
  //     }
  //     let totalCount = 0;
  //     const cursor = await this.db.db.collection(entity_name).find();

  //     let document;
  //     while ((document = await cursor.next())) {
  //       // Check if document has arguments and device_id property

  //       if (document.arguments && document.arguments.device_id) {
  //         // const deviceIdFromDB = document.arguments.device_id.toString();
  //         const deviceIdFromDB = document.arguments.device_id;
  //         const deviceIdFromFrontend = deviceIds
  //           .find((id) => id === deviceIdFromDB)
  //           .countDocuments();
  //         if (deviceIdFromFrontend) {
  //           return deviceIdFromDB;
  //         }
  //       }
  //     }

  //     return deviceIdFromDB;
  //   } catch (error) {
  //     console.error("Error in getJobsCountByDeviceIds:", error);
  //     return null;
  //   }
  // }
  async getJobsByDeviceIds(entity_name, deviceIds) {
    try {
      // Check if the collection exists
      const collectionExists = await this.db.db
        .listCollections({ name: entity_name })
        .hasNext();

      if (!collectionExists) {
        return { status: false, reason: "The collection doesn't exist" };
      }

      let count = 0;

      // Use MongoDB find to get documents in the collection
      const cursor = await this.db.db.collection(entity_name).find();

      while (await cursor.hasNext()) {
        const document = await cursor.next();

        // Check if document has arguments and device_id property
        if (document.arguments && document.arguments.device_id) {
          const deviceIdFromDB = document.arguments.device_id.toString();

          // Check if the device ID from the database is in the provided deviceIds array
          if (deviceIds.includes(deviceIdFromDB)) {
            count++;
          }
        }
      }

      return { status: true, count };
    } catch (error) {
      console.error("Error in getJobsCountByDeviceIds:", error);
      return { status: false, reason: "Error accessing the database" };
    }
  }

  //getting device names
  async getDeviceNamesByDeviceIds(entity_name, deviceId) {
    console.log("collection and id :", entity_name, deviceId);
    try {
      // Check if the collection exists
      const collectionExist = check_collection_exist(entity_name);
      if (!collectionExist) {
        // Return null or an empty array if the collection doesn't exist
        return [];
      }

      // Construct the filter to find devices by UUID
      const filter = {
        UUID: deviceId,
      };

      // Use MongoDB findOne to get the device document for the specified UUID
      const device = await this.db.db.collection(entity_name).findOne(filter);
      console.log("device id", device);
      // Check if the device exists
      if (!device) {
        return [];
      }

      // Extract the device name from the device document
      const deviceName = device.instance_name;

      console.log("Device Name:", deviceName);
      return [deviceName];
    } catch (error) {
      console.error("Error in getDeviceNamesByDeviceIds:", error);
      return []; // or you can return null or throw an error
    }
  }
  async getDeviceNamesByDeviceIdsJobs(entity_name, deviceId) {
    console.log("collection and id :", entity_name);

    try {
      const collectionExist = check_collection_exist(entity_name);

      if (!collectionExist) {
        return [];
      }

      const filter = {
        UUID: deviceId,
      };

      const device = await this.db.db.collection(entity_name).findOne(filter);
      console.log("Device Name:", device.arguments.device_id);
      if (!device) {
        return [];
      }

      const deviceid = device;

      return [deviceid];
    } catch (error) {
      console.error("Error :", error);
      throw error; // Throw the error for better handling
    }
  }
  async createCollection(entity_name) {
    try {
      const collection_exist = check_collection_exist(entity_name);
      if (collection_exist) {
        return { status: false, reason: "The collection already exists" };
      }
      await this.db.db.createCollection(entity_name);
      return true;
    } catch {
      return;
    }
  }

  async getCollectionCount(
    entity_name,
    find_by,
    value,
    direction,
    query_string,
    query_string_fields
  ) {
    try {
      const collection_exist = check_collection_exist(entity_name);
      if (!collection_exist) {
        return { status: false, reason: "The collection doesn't exist" };
      }

      var stringFilter = {};
      if (query_string !== undefined && query_string_fields !== undefined) {
        var filterDetTemp = [];
        var temp = {};
        temp["$regex"] = query_string;
        temp["$options"] = "i";
        for (let i = 0; i < query_string_fields.length; i++) {
          var filterTemp = {};
          filterTemp[query_string_fields[i]] = temp;
          filterDetTemp.push(filterTemp);
        }
        stringFilter["$or"] = filterDetTemp;
      }

      var queryFilter = {};
      if (find_by) {
        for (let i = 0; i < find_by.length; i++) {
          if (value[i] !== undefined && value[i] !== "undefined") {
            if (direction[i] === 1) {
              if (queryFilter[find_by[i]]) {
                queryFilter[find_by[i]].$gte = value[i];
              } else {
                queryFilter[find_by[i]] = { $gte: value[i] };
              }
            } else if (direction[i] === -1) {
              if (queryFilter[find_by[i]]) {
                queryFilter[find_by[i]].$lte = value[i];
              } else {
                queryFilter[find_by[i]] = { $lte: value[i] };
              }
            } else {
              if (find_by[i] !== null && find_by[i] !== undefined) {
                queryFilter[find_by[i]] = value[i];
              }
            }
          }
        }
      }

      var filter = {};
      if (
        Object.entries(stringFilter).length !== 0 &&
        Object.entries(queryFilter).length !== 0
      ) {
        filter["$and"] = [stringFilter, queryFilter];
      } else if (Object.entries(stringFilter).length !== 0) {
        filter = { ...stringFilter };
      } else if (Object.entries(queryFilter).length !== 0) {
        filter = { ...queryFilter };
      }

      var noOfInstances = 0;
      noOfInstances = await this.db.db
        .collection(entity_name)
        .find(filter)
        .count();

      return { status: true, count: noOfInstances > 0 ? noOfInstances : 0 };
    } catch {
      return { status: false, reason: "Was not able to access the database" };
    }
  }

  async getSortedCollection(
    entity_name,
    sort_by,
    direction,
    no_of_instances,
    unshaped,
    start_of_instances
  ) {
    try {
      const collection_exist = check_collection_exist(entity_name);
      if (!collection_exist) {
        return { status: false, reason: "The collection doesn't exist" };
      }
      const results = [];
      var result = [];
      if (no_of_instances === null) {
        result = this.db.db
          .collection(entity_name)
          .find()
          .sort([sort_by, direction]);
      } else {
        result = this.db.db
          .collection(entity_name)
          .find()
          .sort([sort_by, direction])
          .skip(start_of_instances)
          .limit(no_of_instances);
      }

      await result.forEach(function (item) {
        results.push(item);
      });

      if (unshaped !== true) {
        var filterDet = {};
        filterDet["entity_name"] = entity_name;
        const shape = await this.db.db
          .collection("collection_details")
          .findOne(filterDet);
        if (shape && results) {
          return reshape(shape, results);
        }
      }

      return { status: true, instances: results };
    } catch {
      return { status: false, reason: "Was not able to access the database" };
    }
  }

  async getFilteredAndSortedCollection(
    entity_name,
    find_by,
    value,
    direction,
    unshaped,
    sort_by,
    sort_direction,
    no_of_instances,
    start_of_instances,
    query_string,
    query_string_fields,
    tenants,
    users
  ) {
    try {
      const collection_exist = check_collection_exist(entity_name);
      if (!collection_exist) {
        return { status: false, reason: "The collection doesn't exist" };
      }

      var stringFilter = {};
      if (query_string !== undefined && query_string_fields !== undefined) {
        var filterDetTemp = [];
        var temp = {};
        temp["$regex"] = query_string;
        temp["$options"] = "i";
        for (let i = 0; i < query_string_fields.length; i++) {
          var filterTemp = {};
          filterTemp[query_string_fields[i]] = temp;
          filterDetTemp.push(filterTemp);
        }
        stringFilter["$or"] = filterDetTemp;
      }

      var tenantFilter = {};
      if (tenants !== undefined && tenants.length > 0) {
        var filterDetTemp = [];
        for (let i = 0; i < tenants.length; i++) {
          var filterTemp = {};
          filterTemp["tenant"] = tenants[i];
          filterDetTemp.push(filterTemp);
        }
        tenantFilter["$or"] = filterDetTemp;
      }

      var userFilter = {};
      if (users !== undefined && users.length > 0) {
        var filterDetTemp = [];
        for (let i = 0; i < users.length; i++) {
          var filterTemp = {};
          filterTemp["created_by"] = users[i];
          filterDetTemp.push(filterTemp);
        }
        userFilter["$or"] = filterDetTemp;
      }

      var queryFilter = {};
      if (find_by) {
        for (let i = 0; i < find_by.length; i++) {
          if (value[i] !== undefined && value[i] !== "undefined") {
            if (direction[i] === 1) {
              if (queryFilter[find_by[i]]) {
                queryFilter[find_by[i]].$gte = value[i];
              } else {
                queryFilter[find_by[i]] = { $gte: value[i] };
              }
            } else if (direction[i] === -1) {
              if (queryFilter[find_by[i]]) {
                queryFilter[find_by[i]].$lte = value[i];
              } else {
                queryFilter[find_by[i]] = { $lte: value[i] };
              }
            } else {
              if (find_by[i] !== null && find_by[i] !== undefined) {
                queryFilter[find_by[i]] = value[i];
              }
            }
          }
        }
      }

      var val_1 = Object.entries(stringFilter).length !== 0 ? 1 : 0;
      var val_2 = Object.entries(tenantFilter).length !== 0 ? 1 : 0;
      var val_3 = Object.entries(userFilter).length !== 0 ? 1 : 0;
      var val_4 = Object.entries(queryFilter).length !== 0 ? 1 : 0;
      var val = val_1 + val_2 + val_3 + val_4;

      var filter = {};
      if (val === 1) {
        if (Object.entries(stringFilter).length !== 0) {
          filter = { ...stringFilter };
        } else if (Object.entries(tenantFilter).length !== 0) {
          filter = { ...tenantFilter };
        } else if (Object.entries(userFilter).length !== 0) {
          filter = { ...userFilter };
        } else if (Object.entries(queryFilter).length !== 0) {
          filter = { ...queryFilter };
        }
      } else if (val > 1) {
        var tempFilter = [];
        if (Object.entries(stringFilter).length !== 0) {
          tempFilter.push(stringFilter);
        }
        if (Object.entries(tenantFilter).length !== 0) {
          tempFilter.push(tenantFilter);
        }
        if (Object.entries(userFilter).length !== 0) {
          tempFilter.push(userFilter);
        }
        if (Object.entries(queryFilter).length !== 0) {
          tempFilter.push(queryFilter);
        }
        filter["$and"] = tempFilter;
      }
      const results = [];
      const result =
        sort_by &&
        sort_direction !== undefined &&
        no_of_instances !== undefined &&
        start_of_instances !== undefined
          ? this.db.db
              .collection(entity_name)
              .find(filter)
              .sort([sort_by, sort_direction])
              .skip(start_of_instances)
              .limit(no_of_instances)
          : sort_by && sort_direction !== undefined
          ? this.db.db
              .collection(entity_name)
              .find(filter)
              .sort([sort_by, sort_direction])
          : no_of_instances !== undefined && start_of_instances !== undefined
          ? this.db.db
              .collection(entity_name)
              .find(filter)
              .skip(start_of_instances)
              .limit(no_of_instances)
          : this.db.db.collection(entity_name).find(filter);
      await result.forEach(function (item) {
        results.push(item);
      });

      var noOfInstances = 0;
      noOfInstances =
        sort_by && sort_direction !== undefined
          ? await this.db.db
              .collection(entity_name)
              .find(filter)
              .sort([sort_by, sort_direction])
              .count()
          : await this.db.db.collection(entity_name).find(filter).count();
      if (unshaped !== true) {
        var filterDet = {};
        filterDet["entity_name"] = entity_name;
        const shape = await this.db.db
          .collection("collection_details")
          .findOne(filterDet);
        if (shape && results) {
          return reshape(shape, results);
        }
      }

      return { status: true, instances: results, count: noOfInstances };
    } catch {
      return { status: false, reason: "Was not able to access the database" };
    }
  }

  async getFilteredAndSortedCollectionSummary(
    entity_name,
    find_by,
    value,
    direction,
    sort_by,
    sort_direction,
    tenants,
    users
  ) {
    try {
      const collection_exist = check_collection_exist(entity_name);
      if (!collection_exist) {
        return { status: false, reason: "The collection doesn't exist" };
      }

      var tenantFilter = {};
      if (tenants !== undefined && tenants.length > 0) {
        var filterDetTemp = [];
        for (let i = 0; i < tenants.length; i++) {
          var filterTemp = {};
          filterTemp["tenant"] = tenants[i];
          filterDetTemp.push(filterTemp);
        }
        tenantFilter["$or"] = filterDetTemp;
      }

      var userFilter = {};
      if (users !== undefined && users.length > 0) {
        var filterDetTemp = [];
        for (let i = 0; i < users.length; i++) {
          var filterTemp = {};
          filterTemp["created_by"] = users[i];
          filterDetTemp.push(filterTemp);
        }
        userFilter["$or"] = filterDetTemp;
      }

      var queryFilter = {};
      if (find_by) {
        for (let i = 0; i < find_by.length; i++) {
          if (value[i] !== undefined && value[i] !== "undefined") {
            if (direction[i] === 1) {
              if (queryFilter[find_by[i]]) {
                queryFilter[find_by[i]].$gte = value[i];
              } else {
                queryFilter[find_by[i]] = { $gte: value[i] };
              }
            } else if (direction[i] === -1) {
              if (queryFilter[find_by[i]]) {
                queryFilter[find_by[i]].$lte = value[i];
              } else {
                queryFilter[find_by[i]] = { $lte: value[i] };
              }
            } else {
              if (find_by[i] !== null && find_by[i] !== undefined) {
                queryFilter[find_by[i]] = value[i];
              }
            }
          }
        }
      }

      var filter = {};
      var val_2 = Object.entries(tenantFilter).length !== 0 ? 1 : 0;
      var val_3 = Object.entries(userFilter).length !== 0 ? 1 : 0;
      var val_4 = Object.entries(queryFilter).length !== 0 ? 1 : 0;
      var val = val_2 + val_3 + val_4;

      var filter = {};
      if (val === 1) {
        if (Object.entries(tenantFilter).length !== 0) {
          filter = { ...tenantFilter };
        } else if (Object.entries(userFilter).length !== 0) {
          filter = { ...userFilter };
        } else if (Object.entries(queryFilter).length !== 0) {
          filter = { ...queryFilter };
        }
      } else if (val > 1) {
        var tempFilter = [];
        if (Object.entries(tenantFilter).length !== 0) {
          tempFilter.push(tenantFilter);
        }
        if (Object.entries(userFilter).length !== 0) {
          tempFilter.push(userFilter);
        }
        if (Object.entries(queryFilter).length !== 0) {
          tempFilter.push(queryFilter);
        }
        filter["$and"] = tempFilter;
      }

      const results = [];
      const result =
        sort_by && sort_direction !== undefined
          ? this.db.db
              .collection(entity_name)
              .find(filter)
              .sort([sort_by, sort_direction])
          : this.db.db.collection(entity_name).find(filter);
      await result.forEach(function (item) {
        var temp = {};
        temp.UUID = item.UUID;
        temp.instance_name = item.instance_name;
        results.push(temp);
      });

      return { status: true, instances: results };
    } catch {
      return { status: false, reason: "Was not able to access the database" };
    }
  }

  async getInstance(entity_name, find_by, value, unshaped) {
    try {
      const collection_exist = check_collection_exist(entity_name);
      if (!collection_exist) {
        return { status: false, reason: "The collection doesn't exist" };
      }
      console.log("entityname", entity_name);

      var filter = {};
      filter[find_by] = value;
      console.log("filter", filter);
      const result = await this.db.db.collection(entity_name).findOne(filter);
      console.log("result", result);
      if (result) {
        if (unshaped !== true) {
          var filterDet = {};
          filterDet["entity_name"] = entity_name;

          const shape = await this.db.db
            .collection("collection_details")
            .findOne(filterDet);

          if (shape) {
            const data = await reshape(shape, [result]);
            if (data.instances && data.instances[0]) {
              return { status: true, instance: data.instances[0] };
            }
          }
        }
        return { status: true, instance: result };
      } else {
        return { status: false, reason: "Instance was not found" };
      }
    } catch {
      return { status: false, reason: "Was not able to access the database" };
    }
  }

  async getTenantDetails(tenantUUID) {
    try {
      const tenant_entity = "tenants";
      console.log("GetTenant", tenantUUID);
      const result = await this.getInstance(tenant_entity, "UUID", tenantUUID);

      if (result.status && result.instance) {
        return { status: true, instance: result.instance };
      } else {
        return { status: false, reason: "Tenant not found" };
      }
    } catch (error) {
      console.error("Error in getTenantDetails:", error);
      return { status: false, reason: "Internal server error" };
    }
  }

  async insertInstance(entity_name, instance, current_user) {
    try {
      const collection_exist = check_collection_exist(entity_name);
      if (!collection_exist) {
        return { status: false, reason: "The collection doesn't exist" };
      }

      instanceDetails(instance, current_user, "add");

      var unique = true;
      var filterDet = {};
      filterDet["entity_name"] = entity_name;
      const shape = await this.db.db
        .collection("collection_details")
        .findOne(filterDet);
      if (instance && shape && shape.uniqueness) {
        unique = await uniqueCheck(shape.uniqueness, instance, entity_name);
      }

      if (unique === true) {
        const newInstance = await this.db.db
          .collection(entity_name)
          .insertOne(instance);

        const finalInstance = { _id: newInstance._id, ...instance };

        return {
          status: true,
          reason: "Succesfully added an instance",
          instance: finalInstance,
        };
      }
      return { status: false, reason: "The entry fails the unique test" };
    } catch {
      return { status: false, reason: "Was not able to access the database" };
    }
  }

  async replaceInstance(entity_name, find_by, value, instance, current_user) {
    try {
      const collection_exist = check_collection_exist(entity_name);
      if (!collection_exist) {
        return { status: false, reason: "The collection doesn't exist" };
      }

      instanceDetails(instance, current_user, "edit");

      var unique = true;
      var filterDet = {};
      filterDet["entity_name"] = entity_name;

      const shape = await this.db.db
        .collection("collection_details")
        .findOne(filterDet);

      if (instance && shape && shape.uniqueness) {
        unique = await uniqueCheck(shape.uniqueness, instance, entity_name);
      }

      if (unique === true) {
        var filter = {};
        filter[find_by] = value;

        var existing = await this.db.db.collection(entity_name).findOne(filter);
        if (!existing) {
          return res.status(400).json({
            status: false,
            reason: "Instance not found in the system",
          });
        }
        for (const [key, value] of Object.entries(instance)) {
          if (value !== undefined || value !== null) {
            existing[key] = value;
          }
        }
        const _id = existing._id;
        delete existing._id;
        const result = await this.db.db
          .collection(entity_name)
          .replaceOne(filter, existing);
        if (result.modifiedCount != 1) {
          return {
            status: false,
            reason: "Instance not found in the system at the time of update",
          };
        }

        return { status: true, instance: { ...existing, _id: _id } };
      }
      return { status: false, reason: "The entry fails the unique test" };
    } catch {
      return { status: false, reason: "Was not able to access the database" };
    }
  }

  async deleteInstances(entity_name, find_by, instance, deletedEntities) {
    try {
      const collection_exist = check_collection_exist(entity_name);
      if (!collection_exist) {
        return { status: false, reason: "The collection doesn't exist" };
      }

      var filter = {};
      filter[find_by] = instance[find_by];

      var results = [];
      const resultTemp = this.db.db.collection(entity_name).find(filter);
      await resultTemp.forEach(function (item) {
        results.push(item);
      });

      var filterDet = {};
      var deleteSuccess = true;
      var reason = "";
      filterDet["entity_name"] = entity_name;
      const shape = await this.db.db
        .collection("collection_details")
        .findOne(filterDet);
      if (shape && results && shape.referenced_entities) {
        for (let i = 0; i < shape.referenced_entities.length; i++) {
          const data = await cleanDelete(
            shape.referenced_entities[i],
            results,
            deletedEntities
          );
          deleteSuccess = data.status;
          reason = data.reason;
        }
      }

      if (deleteSuccess === true) {
        this.db.db.collection(entity_name).deleteMany(filter);
        if (deletedEntities[entity_name]) {
          deletedEntities[entity_name] = [
            ...deletedEntities[entity_name],
            ...results,
          ];
        } else {
          deletedEntities[entity_name] = results;
        }

        return {
          status: true,
          reason: "Successfully deleted",
          deletedEntities: deletedEntities,
        };
      } else {
        return { status: false, reason: reason, instance: instance };
      }
    } catch {
      return;
    }
  }
  async getJobDetailsByDeviceIds(entityName, deviceIds) {
    try {
      const collection = this.db.db.collection(entityName);

      // Convert deviceIds to ObjectId if needed
      const deviceIdsAsString = deviceIds.map((deviceId) => String(deviceId));
      const jobDetails = await collection
        .find({ "arguments.device_id": { $in: deviceIdsAsString } })
        .toArray();

      console.log("Details have", jobDetails);
      return jobDetails;
    } catch (error) {
      console.error("Error in getJobDetailsByDeviceIds:", error);
      throw error;
    }
  }
  async getJobDetailsAll(entityName, deviceIds) {
    try {
      const collection = this.db.db.collection(entityName);

      // Convert deviceIds to ObjectId if needed
      const query = {
        "arguments.device_id": { $type: "string", $nin: [null, "null"] },
      };
      const jobDetails = await collection.find(query).toArray();

      // const jobDetails = await collection
      //   .find({ "arguments.device_id": { $in: deviceIdsAsString } })
      //   .toArray();

      console.log("Details have All", jobDetails);
      return jobDetails;
    } catch (error) {
      console.error("Error in getJobDetailsByDeviceIds:", error);
      throw error;
    }
  }
  async getJobsIds(entity_name, jobUUID) {
    try {
      // Check if the collection exists
      const collectionExist = check_collection_exist(entity_name);
      if (!collectionExist) {
        // Return null or an empty array if the collection doesn't exist
        return [];
      }

      // Construct the filter to find a user by UUID
      const filter = {
        UUID: jobUUID,
        arguments,
      };

      // Use MongoDB find to get the user document for the specified UUID
      const job = await this.db.db.collection(entity_name).findOne(filter);

      // Check if the user exists
      if (!job) {
        return [];
      }

      // Extract the UUIDs of the associated jobs dveices
      const deviceIds = job.map((deviceid) =>
        deviceid.device_id.UUID.toString()
      );

      console.log("device idsss", job);
      return deviceIds;
    } catch (error) {
      console.error("Error in get device id:", error);
      return []; // or you can return null or throw an error
    }
  }
}

module.exports = new DBAccess();
