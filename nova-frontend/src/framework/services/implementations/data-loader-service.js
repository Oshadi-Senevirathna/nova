import { EMPTY } from 'rxjs';
import config from '../../configs/config.json';
import {
    ENTITY_NAME_USERS,
    ENTITY_NAME_SETTINGS,
    ENTITY_NAME_USER_ROLES,
    ENTITY_NAME_USER_PRIVILEGES,
    ENTITY_NAME_DEVICE,
    ENTITY_NAME_FRONTEND_JOBS,
    ENTITY_NAME_TENANT,
    ENTITY_NAME_VM_IMAGE,
    ENTITY_NAME_LOGS_USER,
    ENTITY_NAME_VM_CONFIGS,
    ENTITY_NAME_VM_TEMPLATES,
    ENTITY_NAME_INVENTORY_LOGS,
    ENTITY_NAME_COMPANY
} from '../../caching/entity-cache';
import EntitySubscription from '../../caching/entity-subscription';
import serviceFactoryInstance from '../service-factory';
import AbstractDataLoaderService from '../abstract/abstract-data-loader-service';

const entities = {
    [ENTITY_NAME_TENANT]: {
        name: ENTITY_NAME_TENANT,
        endpoint: `/get_filtered_and_sorted_instances?entity_name=${ENTITY_NAME_TENANT}`
    },
    [`${ENTITY_NAME_TENANT}>summary`]: {
        name: ENTITY_NAME_TENANT,
        endpoint: `/get_filtered_and_sorted_instances_summary?entity_name=${ENTITY_NAME_TENANT}`
    },
    [ENTITY_NAME_COMPANY]: {
        name: ENTITY_NAME_COMPANY,
        endpoint: `/get_filtered_and_sorted_instances?entity_name=${ENTITY_NAME_COMPANY}`
    },
    [`${ENTITY_NAME_COMPANY}>summary`]: {
        name: ENTITY_NAME_COMPANY,
        endpoint: `/get_filtered_and_sorted_instances_summary?entity_name=${ENTITY_NAME_COMPANY}`
    },
    [ENTITY_NAME_LOGS_USER]: {
        name: ENTITY_NAME_LOGS_USER,
        endpoint: `/get_filtered_and_sorted_instances?entity_name=${ENTITY_NAME_LOGS_USER}&company_only=true`
    },
    [ENTITY_NAME_INVENTORY_LOGS]: {
        name: ENTITY_NAME_INVENTORY_LOGS,
        endpoint: `/get_filtered_and_sorted_instances?sort_by=timestamp&sort_direction=-1&entity_name=${ENTITY_NAME_INVENTORY_LOGS}`
    },
    [ENTITY_NAME_SETTINGS]: {
        name: ENTITY_NAME_SETTINGS,
        endpoint: `/get_filtered_and_sorted_instances?entity_name=${ENTITY_NAME_SETTINGS}`
    },
    [ENTITY_NAME_DEVICE]: {
        name: ENTITY_NAME_DEVICE,
        endpoint: `/get_filtered_and_sorted_instances?entity_name=${ENTITY_NAME_DEVICE}`
    },
    [`${ENTITY_NAME_DEVICE}>summary`]: {
        name: ENTITY_NAME_DEVICE,
        endpoint: `/get_filtered_and_sorted_instances_summary?entity_name=${ENTITY_NAME_DEVICE}`
    },
    [ENTITY_NAME_VM_CONFIGS]: {
        name: ENTITY_NAME_VM_CONFIGS,
        endpoint: `/get_filtered_and_sorted_instances?entity_name=${ENTITY_NAME_VM_CONFIGS}&company_only=true`
    },
    [ENTITY_NAME_VM_TEMPLATES]: {
        name: ENTITY_NAME_VM_TEMPLATES,
        endpoint: `/get_filtered_and_sorted_instances?entity_name=${ENTITY_NAME_VM_TEMPLATES}&company_only=true`
    },
    [`${ENTITY_NAME_VM_TEMPLATES}>summary`]: {
        name: ENTITY_NAME_VM_TEMPLATES,
        endpoint: `/get_filtered_and_sorted_instances_summary?entity_name=${ENTITY_NAME_VM_TEMPLATES}&company_only=true`
    },
    [ENTITY_NAME_VM_IMAGE]: {
        name: ENTITY_NAME_VM_IMAGE,
        endpoint: `/get_filtered_and_sorted_instances?entity_name=${ENTITY_NAME_VM_IMAGE}&company_only=true`
    },
    [`${ENTITY_NAME_VM_IMAGE}>summary`]: {
        name: ENTITY_NAME_VM_IMAGE,
        endpoint: `/get_filtered_and_sorted_instances_summary?entity_name=${ENTITY_NAME_VM_IMAGE}&company_only=true`
    },
    [ENTITY_NAME_FRONTEND_JOBS]: {
        name: ENTITY_NAME_FRONTEND_JOBS,
        endpoint: `/get_filtered_and_sorted_instances?sort_by=created_at&sort_direction=-1&entity_name=${ENTITY_NAME_FRONTEND_JOBS}&company_only=true`
    },
    [ENTITY_NAME_USERS]: {
        name: ENTITY_NAME_USERS,
        endpoint: `/get_users?entity_name=${ENTITY_NAME_USERS}&company_only=true`
    },
    [ENTITY_NAME_USER_ROLES]: {
        name: ENTITY_NAME_USER_ROLES,
        endpoint: `/get_filtered_and_sorted_instances?entity_name=${ENTITY_NAME_USER_ROLES}&company_only=true`
    },
    [ENTITY_NAME_USER_PRIVILEGES]: {
        name: ENTITY_NAME_USER_PRIVILEGES,
        endpoint: `/get_filtered_and_sorted_instances?entity_name=${ENTITY_NAME_USER_PRIVILEGES}`
    },
    [`${ENTITY_NAME_DEVICE}>dashboard>device_status`]: {
        name: ENTITY_NAME_DEVICE,
        endpoint: '/dashboard_device_status?tenant=0'
    },
    //JOBS api
    [`${ENTITY_NAME_FRONTEND_JOBS}>dashboard>jobs_status`]: {
        name: ENTITY_NAME_FRONTEND_JOBS,
        endpoint: '/dashboard_job_details?'
    },
    [`${ENTITY_NAME_DEVICE}>dashboard>device_os`]: {
        name: ENTITY_NAME_DEVICE,
        endpoint: '/dashboard_device_os?tenant=0'
    },
    [`${ENTITY_NAME_FRONTEND_JOBS}>dashboard>job`]: {
        name: ENTITY_NAME_FRONTEND_JOBS,
        endpoint: '/dashboard_job?company_only=true'
    },
    [`${ENTITY_NAME_DEVICE}>dashboard>count_device`]: {
        name: ENTITY_NAME_DEVICE,
        endpoint: `/dashboard_count?entity_name=${ENTITY_NAME_DEVICE}&tenant=0`
    },
    [`${ENTITY_NAME_VM_IMAGE}>dashboard>count_vm_image`]: {
        name: ENTITY_NAME_VM_IMAGE,
        endpoint: `/dashboard_count?entity_name=${ENTITY_NAME_VM_IMAGE}&company_only=true`
    },
    [`${ENTITY_NAME_TENANT}>dashboard>count_tenant`]: {
        name: ENTITY_NAME_TENANT,
        endpoint: `/dashboard_count?entity_name=${ENTITY_NAME_TENANT}`
    },
    [`${ENTITY_NAME_FRONTEND_JOBS}>dashboard>count_jobs`]: {
        name: ENTITY_NAME_TENANT,
        endpoint: `/dashboard_count?entity_name=${ENTITY_NAME_FRONTEND_JOBS}`
    }
};

class DataLoaderService extends AbstractDataLoaderService {
    constructor(cache) {
        super();
        this.cache = cache;
        serviceFactoryInstance.authService.getUserObservable().subscribe((user) => {
            if (!user) {
                this.cache.clear();
            }
        });
    }

    dataSub(
        entity_name,
        tenant,
        tenantUUID,
        noOfInstances,
        startOfInstances,
        queryString,
        fields,
        sortField,
        sortDirection,
        filterField,
        filterValue
    ) {
        if (entity_name) {
            if (this.cache.mapEntitySubscriptions.get(entity_name) === undefined) {
                if (entities.hasOwnProperty(entity_name)) {
                    const entity = entities[entity_name];
                    const subscription = new EntitySubscription(
                        this,
                        entity,
                        tenant,
                        tenantUUID,
                        noOfInstances,
                        startOfInstances,
                        queryString,
                        fields,
                        sortField,
                        sortDirection,
                        filterField,
                        filterValue
                    );
                    this.cache.mapEntitySubscriptions.set(entity_name, subscription);
                    console.log('EntitySubscription added on loadup for the entity: ', entity_name);
                } else {
                    console.log('Subscription is not defined');
                    return EMPTY;
                }
            }
            return this.cache
                .getEntitySubscription(entity_name)
                .getObservable(
                    tenant,
                    tenantUUID,
                    noOfInstances,
                    startOfInstances,
                    queryString,
                    fields,
                    sortField,
                    sortDirection,
                    filterField,
                    filterValue
                );
        } else {
            return EMPTY;
        }
    }

    countSub(entity_name) {
        if (entity_name) {
            if (this.cache.mapEntitySubscriptions.get(entity_name) !== undefined) {
                return this.cache.getEntitySubscription(entity_name).getCountObservable();
            }
        } else {
            return EMPTY;
        }
    }
    async getData(endpoint) {
        const token = serviceFactoryInstance.authService.getAuthToken();
        const sessionID = serviceFactoryInstance.authService.getSessionID();
        const requestOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
                Session: sessionID
            }
        };

        try {
            const response = await fetch(`${config.nodeURL}${endpoint}`, requestOptions);
            console.log('Response', response);
            if (!response.ok) {
                if (response.status === 400) {
                    // Handle bad requests (status code 400) appropriately
                    throw new Error('Bad Request: The request is malformed or invalid.');
                } else {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }
    async getTenantsUUIDByUser(entityName, userUUID) {
        const endpoint = `/getTenantsByUser?entity_name=${entityName}&UUID=${userUUID}`;
        console.log('Endpoint:', endpoint);
        try {
            const data = await this.getData(endpoint);
            console.log('Response data from user tenants:', data.tenantIds);
            const tenantIds = data && data.tenantIds;

            console.log('TenantId:', tenantIds);
            return tenantIds;
        } catch (error) {
            console.error('Error fetching device tenant by user:', error);
            throw error;
        }
    }

    async getDeviceCountByTenant(entityName, tenantUUID) {
        console.log('came tenant uuid', tenantUUID);
        const endpoint = `/dashboard_count_device_by_tenant?entity_name=${entityName}&tenant=${tenantUUID}`;
        console.log('Endpoint:', endpoint); // Add this line for debugging
        try {
            const data = await this.getData(endpoint);
            console.log('Response data for count deevice count:', data); // Add this line for debugging
            return data.count;
        } catch (error) {
            console.error('Error fetching device count by tenant:', error);
            throw error;
        }
    }
    async getAllDevicesCountForJobs(entityName) {
        const endpoint = `/dashboard_count_device_all_jobs?entity_name=${entityName}`;

        try {
            const data = await this.getData(endpoint);
            console.log('Response data for all jobss :', data);
            return data.count.count;
        } catch (error) {
            console.error('Error fetching all device count by tenant:', error);
            throw error;
        }
    }
    async getAllDevicesCount(entityName) {
        const endpoint = `/dashboard_count_device_all?entity_name=${entityName}`;

        try {
            const data = await this.getData(endpoint);
            console.log('Response data for all :', data);
            return data.count;
        } catch (error) {
            console.error('Error fetching all device count by tenant:', error);
            throw error;
        }
    }
    async getAllTenantCountByuser(entityName, UUID) {
        const endpoint = `/dashboard_count_tenant_all?entity_name=${entityName}&UUID=${UUID}`;

        try {
            const data = await this.getData(endpoint);
            console.log('Response data for all TENANT:', data.count);

            return data.count.count;
        } catch (error) {
            console.error('Error fetching all device count by tenant:', error);
            throw error;
        }
    }

    async getAllTenantAllCount(entityName) {
        const endpoint = `/dashboard_count_tenant_all_superadmin?entity_name=${entityName}`;

        try {
            const data = await this.getData(endpoint);
            console.log('Response data for all TENANT all superadmin:', data.count);

            return data.count;
        } catch (error) {
            console.error('Error fetching all device count by tenant:', error);
            console.error('Error details:', error.response?.data);
            throw error;
        }
    }
    // getting the device ids
    async getDeviceIdsByTenant(entityName, tenantUUID) {
        const endpoint = `/dashboard_device_ids_by_tenant?entity_name=${entityName}&tenant=${tenantUUID}`;
        console.log('Endpoint:', endpoint); // Add this line for debugging
        try {
            const data = await this.getData(endpoint);
            console.log('Response data for device idS:', data); // Add this line for debugging
            return data.deviceIds; // Assuming the response contains an array of device IDs
        } catch (error) {
            console.error('Error fetching device IDs by tenant:', error);
            throw error;
        }
    }
    //getdevice names
    async getDataById(entityName, deviceId) {
        console.log('Idaa', deviceId);
        const endpoint = `/dashboard_device_names_by_deviceIds_jobs?entity_name=${entityName}&UUID=${deviceId}`;
        console.log('Endpoint:', endpoint); // Add this line for debugging
        try {
            const data = await this.getData(endpoint);
            console.log('Response data for device names in jobs:', data); // Add this line for debugging
            return data.devicenames; // Assuming the response contains an array of device IDs
        } catch (error) {
            console.error('Error fetching device IDs by tenant:', error);
            throw error;
        }
    }
    async getDevicenameByDeviceID(entityName, deviceId) {
        console.log('Idaa', deviceId);
        const endpoint = `/dashboard_device_names_by_deviceIds?entity_name=${entityName}&UUID=${deviceId}`;
        console.log('Endpoint:', endpoint); // Add this line for debugging
        try {
            const data = await this.getData(endpoint);
            console.log('Response data for device names in jobs names:', data); // Add this line for debugging
            return data.devicenames; // Assuming the response contains an array of device IDs
        } catch (error) {
            console.error('Error fetching device IDs by device names:', error);
            throw error;
        }
    }

    //getTenants
    // async getTenant(entityName, UserUUID, unshaped) {
    //     let unshapedTemp;
    //     if (unshaped === false) {
    //         unshapedTemp = false;
    //     } else {
    //         unshapedTemp = true;
    //     }
    //     const endpoint = `/get_tenants?entity_name=${entityName}&UUID=${UserUUID}&unshaped=${unshaped}`;
    //     try {
    //         const data = await this.getData(endpoint);
    //         console.log('Response Roles for all tenantsssss:', data);
    //         return data;
    //     } catch (error) {
    //         console.error('Error fetching all roles :', error);
    //         throw error;
    //     }
    // }
    async getTenant(entityName, UserUUID, unshaped) {
        let unshapedTemp;
        if (unshaped === false) {
            unshapedTemp = false;
        } else {
            unshapedTemp = true;
        }
        const endpoint = `/get_tenants?entity_name=${entityName}&UUID=${UserUUID}&unshaped=${unshaped}`;
        try {
            const data = await this.getData(endpoint);
            console.log('Response Roles for all tenantsssss:', data.instances);

            // Return only the tenants array from the instances property
            const tenants = data.instances[0]?.tenants || [];
            console.log('Tenants:', tenants);

            return tenants;
        } catch (error) {
            console.error('Error fetching all roles:', error);
            throw error;
        }
    }
    async getFrontendJobsById(jobId, entityName) {
        try {
            console.log('Job id', jobId);
            // const endpoint = `/dashboard_job_byid?entity_name=${entityName}&UUID=${jobId}`;
            const endpoint = `/dashboard_job_byid?entity_name=${entityName}&UUID=${jobId}`;

            console.log('Endpoint for jobs:', endpoint);
            const data = await this.getData(endpoint);
            console.log('Respons job countfor device id:', data);
            return data;
        } catch (error) {
            console.error('Error fetching jobs by device IDs:', error);
            throw error;
        }
    }

    // get jobs count
    async getJobsByDeviceId(entityName, deviceIds) {
        try {
            const endpoint = `/jobs_by_device?entity_name=${entityName}&device_ids=${deviceIds.join(',')}`;
            console.log('Endpoint:', endpoint);
            const data = await this.getData(endpoint);
            console.log('Response data for job count:', data.jobs);
            return data.jobs.count;
        } catch (error) {
            console.error('Error fetching jobs by device IDs:', error);
            throw error;
        }
    }

    async getRoles(entityName, unshaped) {
        let unshapedTemp;
        if (unshaped === false) {
            unshapedTemp = false;
        } else {
            unshapedTemp = true;
        }
        const endpoint = `/get_roles?entity_name=${entityName}&unshaped=${unshaped}`;

        try {
            const data = await this.getData(endpoint);
            // console.log('Response Roles for all :', data);
            return data;
        } catch (error) {
            console.error('Error fetching all roles :', error);
            throw error;
        }
    }
    async getRoleName(entityName, roleUUID, unshaped) {
        let unshapedTemp;
        if (unshaped === false) {
            unshapedTemp = false;
        } else {
            unshapedTemp = true;
        }
        const endpoint = `/get_role_name?entity_name=${entityName}&UUID=${roleUUID}&unshaped=${unshapedTemp}`;

        try {
            const data = await this.getData(endpoint);
            // console.log('Response Role name for all :', data);
            return data;
        } catch (error) {
            console.error('Error fetching role name:', error);
            throw error;
        }
    }

    async getInstance(UUID, entity_name, unshaped) {
        let unshapedTemp;
        if (unshaped === false) {
            unshapedTemp = false;
        } else {
            unshapedTemp = true;
        }

        const endpoint = `/get_instance?entity_name=${entity_name}&UUID=${UUID}&unshaped=${unshapedTemp}`;
        const token = serviceFactoryInstance.authService.getAuthToken();
        const sessionID = serviceFactoryInstance.authService.getSessionID();
        const requestOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
                Session: sessionID
            }
        };

        return fetch(`${config.nodeURL}${endpoint}`, requestOptions)
            .then((response) => response.json())
            .then((data) => {
                return data;
            })
            .catch((reason) => {
                this.cache.setNetworkAccessFailedTrue();
                return reason;
            });
    }

    async getSelectedTenantDetails(tenantUUID) {
        const endpoint = `/tenants_details?UUID=${tenantUUID}`;
        const token = serviceFactoryInstance.authService.getAuthToken();
        const sessionID = serviceFactoryInstance.authService.getSessionID();
        const requestOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
                Session: sessionID
            }
        };

        try {
            const response = await fetch(`${config.nodeURL}${endpoint}`, requestOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log(data);
            return data;
        } catch (error) {
            console.error('Error fetching tenant details:', error);
            throw error;
        }
    }

    async getFieldValues(entity_name, field) {
        const endpoint = `/get_field_values?entity_name=${entity_name}&field=${field}`;
        const token = serviceFactoryInstance.authService.getAuthToken();
        const sessionID = serviceFactoryInstance.authService.getSessionID();
        const requestOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
                Session: sessionID
            }
        };

        return fetch(`${config.nodeURL}${endpoint}`, requestOptions)
            .then((response) => response.json())
            .then((data) => {
                return data;
            })
            .catch((reason) => {
                this.cache.setNetworkAccessFailedTrue();
                return reason;
            });
    }

    async getFilteredAndSortedInstances(
        entity_name,
        queryString,
        queryStringFields,
        sort_by,
        sort_direction,
        findBy,
        value,
        direction,
        unshaped,
        tenant
    ) {
        var url = `/get_filtered_and_sorted_instances?entity_name=${entity_name}&unshaped=${unshaped}`;

        if (findBy !== undefined && value !== undefined) {
            url = `${url}&findBy=${findBy}&value=${value}&direction=${direction}`;
        }

        if (queryString && queryString.length !== undefined && queryString.length > 0 && queryStringFields) {
            url = `${url}&queryString=${queryString}&queryStringFields=[${queryStringFields}]`;
        }

        if (sort_by) {
            url = `${url}&sort_direction=${sort_direction}&sort_by=${sort_by}`;
        }

        if (tenant !== undefined) {
            url = `${url}&tenant=${tenant.UUID}`;
        }

        const token = serviceFactoryInstance.authService.getAuthToken();
        const sessionID = serviceFactoryInstance.authService.getSessionID();
        const requestOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
                Session: sessionID
            }
        };

        return fetch(`${config.nodeURL}${url}`, requestOptions)
            .then((response) => response.json())
            .then((data) => {
                return data;
            })
            .catch((reason) => {
                this.cache.setNetworkAccessFailedTrue();
                return reason;
            });
    }

    async addInstance(entityName, instance) {
        const token = serviceFactoryInstance.authService.getAuthToken();
        const sessionID = serviceFactoryInstance.authService.getSessionID();
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
                Session: sessionID
            },
            body: JSON.stringify({
                entity_name: entityName,
                payload: { ...instance }
            })
        };

        return fetch(`${config.nodeURL}/add_instance`, requestOptions)
            .then((response) => response.json())
            .then((data) => {
                return data;
            })
            .catch((reason) => {
                this.cache.setNetworkAccessFailedTrue();
                return reason;
            });
    }

    async addJob(entityName, instance) {
        const token = serviceFactoryInstance.authService.getAuthToken();
        const sessionID = serviceFactoryInstance.authService.getSessionID();
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
                Session: sessionID
            },
            body: JSON.stringify({
                entity_name: entityName,
                payload: { ...instance }
            })
        };

        return fetch(`${config.nodeURL}/add_job`, requestOptions)
            .then((response) => response.json())
            .then((data) => {
                return data;
            })
            .catch((reason) => {
                this.cache.setNetworkAccessFailedTrue();
                return reason;
            });
    }

    async runjob(UUID) {
        const token = serviceFactoryInstance.authService.getAuthToken();
        const sessionID = serviceFactoryInstance.authService.getSessionID();
        const requestOptions = {
            method: 'OPTIONS',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
                Session: sessionID
            },
            body: JSON.stringify({
                UUID: UUID
            })
        };

        return fetch(`${config.pythonURL}/run_job`, requestOptions)
            .then((response) => response.json())
            .then((data) => {
                return data;
            })
            .catch((reason) => {
                return reason;
            });
    }

    async applyTemplate(template, devices) {
        const token = serviceFactoryInstance.authService.getAuthToken();
        const sessionID = serviceFactoryInstance.authService.getSessionID();
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
                Session: sessionID
            },
            body: JSON.stringify({
                template: template,
                devices: devices
            })
        };

        return fetch(`${config.pythonURL}/apply_template`, requestOptions)
            .then((response) => response.json())
            .then((data) => {
                return data;
            })
            .catch((reason) => {
                return reason;
            });
    }

    async deleteInstance(entityName, UUID) {
        const token = serviceFactoryInstance.authService.getAuthToken();
        const sessionID = serviceFactoryInstance.authService.getSessionID();
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
                Session: sessionID
            },
            body: JSON.stringify({
                entity_name: entityName,
                UUID: UUID
            })
        };

        return fetch(`${config.nodeURL}/delete_instance`, requestOptions)
            .then((response) => response.json())
            .then((data) => {
                return data;
            })
            .catch((reason) => {
                this.cache.setNetworkAccessFailedTrue();
                return reason;
            });
    }

    async updateInstance(entityName, updatedInstance) {
        delete updatedInstance._id;
        const token = serviceFactoryInstance.authService.getAuthToken();
        const sessionID = serviceFactoryInstance.authService.getSessionID();
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
                Session: sessionID
            },
            body: JSON.stringify({
                entity_name: entityName,
                payload: { ...updatedInstance }
            })
        };

        return fetch(`${config.nodeURL}/update_instance`, requestOptions)
            .then((response) => response.json())
            .then((data) => {
                return data;
            })
            .catch((reason) => {
                this.cache.setNetworkAccessFailedTrue();
                return reason;
            });
    }

    async updateInstances(entityName, updatedInstance, UUIDs) {
        const token = serviceFactoryInstance.authService.getAuthToken();
        const sessionID = serviceFactoryInstance.authService.getSessionID();
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
                Session: sessionID
            },
            body: JSON.stringify({
                entity_name: entityName,
                updatedInstance: { ...updatedInstance },
                UUIDs: UUIDs
            })
        };

        return fetch(`${config.nodeURL}/update_instances`, requestOptions)
            .then((response) => response.json())
            .then((data) => {
                return data;
            })
            .catch((reason) => {
                this.cache.setNetworkAccessFailedTrue();
                return reason;
            });
    }

    async loadData(entity, cb) {
        const requestOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + serviceFactoryInstance.authService.getAuthToken(),
                Session: serviceFactoryInstance.authService.getSessionID()
            }
        };

        var url = `${config.nodeURL}${entity.endpoint}`;
        if (entity.noOfInstances !== undefined && entity.startOfInstances !== undefined) {
            url = `${url}&noOfInstances=${entity.noOfInstances}&startOfInstances=${entity.startOfInstances}`;
        }

        if (entity.tenant !== undefined) {
            url = `${url}&tenant=${entity.tenant.UUID}`;
        }
        if (entity.filterField !== undefined) {
            const findBy = `["${entity.filterField}"]`;
            const value = `["${entity.filterValue}"]`;
            const direction = '["0"]';
            url = `${url}&findBy=${findBy}&value=${value}&direction=${direction}`;
        }

        if (entity.queryString && entity.queryString.length !== undefined && entity.queryString.length > 0 && entity.fields) {
            url = `${url}&queryString=${entity.queryString}&queryStringFields=[${entity.fields}]`;
        }

        if (entity.sortField) {
            url = `${url}&sort_direction=${entity.sortDirection}&sort_by=${entity.sortField}`;
        }

        return fetch(url, requestOptions)
            .then((response) => response.json())
            .then((data) => {
                if (data.status) {
                    const instances = data?.instances || [];
                    const count = data?.count || 0;
                    return { instances, count };
                } else {
                    return { instances: [], count: 0 };
                }
            })
            .then((data) => {
                return cb(data);
            })
            .catch((reason) => {
                this.cache.setNetworkAccessFailedTrue();
                return cb([]);
            });
    }

    async validateOldPassword(UUID, pwd) {
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                UUID: UUID,
                pwd: pwd
            })
        };

        try {
            const response = await fetch(`${config.nodeURL}/validatePassword`, requestOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data.status !== undefined) {
                return data.status; // Assuming the status field indicates the validity
            } else {
                console.error('Invalid response format:', data);
                return false;
            }
        } catch (error) {
            console.error('Error validating old password:', error);
            return false;
        }
    }

    async getJobDetailsByDeviceIds(entityName, deviceIds) {
        const endpoint = `/jobs_details_by_device_ids`; // Update the endpoint based on your API
        const token = serviceFactoryInstance.authService.getAuthToken();
        const sessionID = serviceFactoryInstance.authService.getSessionID();

        const requestOptions = {
            method: 'POST', // Assuming your API supports POST method for fetching job details
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
                Session: sessionID
            },
            body: JSON.stringify({ entityName, deviceIds })
        };

        try {
            const response = await fetch(`${config.nodeURL}${endpoint}`, requestOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('F data', data);
            return data;
        } catch (error) {
            console.error('Error fetching job details:', error);
            throw error;
        }
    }

    async getAllJobDetails(entityName) {
        const endpoint = `/jobs_details_by_device_All`; // Update the endpoint based on your API
        const token = serviceFactoryInstance.authService.getAuthToken();
        const sessionID = serviceFactoryInstance.authService.getSessionID();

        const requestOptions = {
            method: 'POST', // Assuming your API supports POST method for fetching job details
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
                Session: sessionID
            },
            body: JSON.stringify({ entityName })
        };

        try {
            const response = await fetch(`${config.nodeURL}${endpoint}`, requestOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('jobs', data);
            return data;
        } catch (error) {
            console.error('Error fetching job all details:', error);
            throw error;
        }
    }
}

export default DataLoaderService;
