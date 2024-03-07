import { useState, useEffect } from 'react';
// material-ui
import { Grid } from '@mui/material';
// project import
import Analytics from 'components/cards/statistics/Analytics';
import {
    ENTITY_NAME_DEVICE,
    ENTITY_NAME_FRONTEND_JOBS,
    ENTITY_NAME_TENANT,
    ENTITY_NAME_USERS,
    ENTITY_NAME_USER_ROLES,
    ENTITY_NAME_VM_IMAGE
} from 'framework/caching/entity-cache';
import serviceFactoryInstance from 'framework/services/service-factory';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism';

// assets

// avatar style
const avatarSX = {
    width: 36,
    height: 36,
    fontSize: '1rem'
};

// action style
const actionSX = {
    mt: 0.75,
    ml: 1,
    top: 'auto',
    right: 'auto',
    alignSelf: 'flex-start',
    transform: 'none'
};

// sales report status
const status = [
    {
        value: 'today',
        label: 'Today'
    },
    {
        value: 'month',
        label: 'This Month'
    },
    {
        value: 'year',
        label: 'This Year'
    }
];

// ==============================|| DASHBOARD - DEFAULT ||============================== //

const AnalyticCardsChart = ({ title }) => {
    const navigate = useNavigate();
    const [devices, setDevices] = useState(0);
    const [vmImages, setVmImages] = useState(0);
    const [tenants, setTenants] = useState(0);
    const [jobs, setJobs] = useState(0);
    const tenantUUID = useSelector((state) => state.selectedTenant.UUID);
    const [deviceId, setDeviceId] = useState([]);
    const [selectedJobs, setSelectedJobs] = useState([]);
    const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUUID, setCurrentUUID] = useState();
    const [userRole, setuserRole] = useState([]);
    const [userRoleUUID, setuserRoleUUID] = useState([]);
    const [defaultDeviceIds, setDefaultDeviceIds] = useState([]);

    const role = 'superadmin';
    const superadminUUID = 0;

    console.log('Selecting tenant uuid', tenantUUID);
    //getting the current user
    useEffect(() => {
        const userSubscription = serviceFactoryInstance.authService.getUserObservable().subscribe((user) => {
            setCurrentUser(user);
        });
        return () => {
            userSubscription.unsubscribe();
        };
    }, []);
    console.log('current user in dashboard', currentUser?.UUID);
    useEffect(() => {
        if (currentUser) {
            setCurrentUUID(currentUser.UUID);
        }
    }, [currentUser]);
    console.log('Origibal user', currentUUID);

    //getting the user role
    useEffect(() => {
        console.log('UUID in tenants', currentUUID);
        if (currentUUID !== 0) {
            console.log('Came');
            serviceFactoryInstance.dataLoaderService.getInstance(currentUUID, ENTITY_NAME_USERS).then((data) => {
                if (data.status) {
                    console.log('Role HEEEE', data);
                    if (data.instance.roles) {
                        setuserRoleUUID(data.instance.roles);
                    } else {
                        setuserRole(role);
                    }
                }
            });
        }
    }, [currentUUID]);

    const UserRole = async (roleUUID) => {
        try {
            const data = await serviceFactoryInstance.dataLoaderService.getRoleName(ENTITY_NAME_USER_ROLES, roleUUID);
            console.log('Datacame', data);
            if (data && data.status) {
                return data;
            } else {
                return 0;
            }
        } catch (error) {
            console.error('Error fetching role name:', error);
            throw error;
        }
    };
    useEffect(() => {
        const fetchRoleName = async () => {
            try {
                if (userRoleUUID != 0) {
                    const roleName = await UserRole(userRoleUUID);
                    console.log('Role Name in tenant page wowww:', roleName.roleName.roleName);
                    setuserRole(roleName.roleName.roleName);
                }
            } catch (error) {}
        };

        fetchRoleName();
    }, [userRoleUUID]);

    //device count for the tenant
    const fetchDeviceCount = async (tenantUUID) => {
        try {
            const count = await serviceFactoryInstance.dataLoaderService.getDeviceCountByTenant(ENTITY_NAME_DEVICE, tenantUUID);
            setDevices(count.count);
        } catch (error) {
            console.error('Error fetching device count:', error);
        }
    };
    // Function to fetch all devices count
    const fetchAllDevicesCount = async () => {
        try {
            const count = await serviceFactoryInstance.dataLoaderService.getAllDevicesCount(ENTITY_NAME_DEVICE);
            setDevices(count);
        } catch (error) {
            console.error('Error fetching all devices count:', error);
        }
    };

    const fetchAllDevicesCountByUser = async (currentUUID) => {
        try {
            const tenantUUIDfordevice = await serviceFactoryInstance.dataLoaderService.getTenantsUUIDByUser(ENTITY_NAME_USERS, currentUUID);

            const data = await serviceFactoryInstance.dataLoaderService.getDeviceCountByTenant(ENTITY_NAME_DEVICE, tenantUUIDfordevice);
            console.log('uuuid for tenants', tenantUUIDfordevice);
            console.log('data came', data);
            setDefaultDeviceIds(data.deviceIds);
            setDevices(data.count);
        } catch (error) {
            console.error('Error fetching all devices count:', error);
        }
    };

    // Function to fetch all jobs count
    const fetchAllJobsCount = async () => {
        try {
            const count = await serviceFactoryInstance.dataLoaderService.getAllDevicesCountForJobs(ENTITY_NAME_FRONTEND_JOBS);
            setJobs(count);
        } catch (error) {
            console.error('Error fetching all devices count:', error);
        }
    };
    // fetching device ids
    const fetchDeviceIdsByTenant = async (tenantUUID) => {
        try {
            const ids = await serviceFactoryInstance.dataLoaderService.getDeviceIdsByTenant(ENTITY_NAME_DEVICE, tenantUUID);
            setDeviceId(ids);
            setSelectedDeviceIds(ids);
            console.log('IDs', ids);
        } catch (error) {
            console.error('Error fetching device IDs by tenant:', error);
        }
    };

    // getting jobs count using device id
    const fetchJobsCountForDeviceIds = async (deviceIds) => {
        try {
            if (Array.isArray(deviceIds)) {
                if (deviceIds.length > 0) {
                    let totalCount = 0;
                    for (const deviceId of deviceIds) {
                        const jobs = await serviceFactoryInstance.dataLoaderService.getJobsByDeviceId(ENTITY_NAME_FRONTEND_JOBS, deviceId);
                        console.log('Jobs', jobs);
                        if (jobs) {
                            totalCount += jobs;
                        } else {
                            console.error('Invalid response for jobs');
                        }
                        console.log('Tot 2', totalCount);
                        setJobs(totalCount);
                        return totalCount;
                    }
                } else {
                    console.error('Device IDs array is empty');
                }
            } else {
                console.error('Device IDs is not an array');
            }
        } catch (error) {
            console.error('Error fetching jobs count for device IDs:', error);
        }
    };

    //fetching tenant count
    console.log('Users Role', userRole);
    useEffect(() => {
        if (userRole == 'User Role' || userRole == 'Insync Role' || userRole == 'Admin Role') {
            fetchTenantCount(currentUUID);
            fetchAllDevicesCountByUser(currentUUID);
        } else {
            console.log('Users roles is not there');
            fetchTenantCountForSuperadmin();
            fetchAllDevicesCount();
        }
    }, [userRole]);
    //fetching for a role
    const fetchTenantCount = async (currentUUID) => {
        try {
            const count = await serviceFactoryInstance.dataLoaderService.getAllTenantCountByuser(ENTITY_NAME_USERS, currentUUID);
            console.log('count', count);
            setTenants(count);
        } catch (error) {
            console.error('Error fetching all devices count:', error);
        }
    };

    //fetching for superadmin
    const fetchTenantCountForSuperadmin = async () => {
        try {
            const count = await serviceFactoryInstance.dataLoaderService.getAllTenantAllCount(ENTITY_NAME_TENANT);
            console.log('count', count);
            setTenants(count);
        } catch (error) {
            console.error('Error fetching all devices count:', error);
        }
    };

    useEffect(() => {
        if (!tenantUUID) {
            if (selectedDeviceIds == 0) {
                fetchAllJobsCount();
            }
        }
    }, [tenantUUID]);

    useEffect(() => {
        if (tenantUUID == 0) {
            if (userRole == 'superadmin') {
                fetchAllDevicesCount();
            } else {
                fetchAllDevicesCountByUser(currentUUID);
            }
        }
    }, [tenantUUID, userRole, currentUUID]);
    //calling the job count function
    useEffect(() => {
        console.log('Tenata', defaultDeviceIds);
        if (tenantUUID == 0 && defaultDeviceIds.length > 0) {
            fetchJobsCountForDeviceIds([defaultDeviceIds]);
        } else {
            if (deviceId.length > 0) {
                fetchJobsCountForDeviceIds([deviceId]);
            }
        }
    }, [deviceId, defaultDeviceIds, tenantUUID]);
    //calling the job setting
    // ...
    const handleCardClickforJobs = async () => {
        if (selectedDeviceIds.length >= 0) {
            navigate(`/jobs`, { state: { selectedDeviceIds } });
        } else {
            console.error('No selected jobs to display');
        }
    };

    useEffect(() => {
        if (tenantUUID) {
            // Calling the device count function
            fetchDeviceCount(tenantUUID);
            fetchDeviceIdsByTenant(tenantUUID);
        } else {
            console.error('Tenant UUID is undefined or null');
        }

        const vmImagesSub = serviceFactoryInstance.dataLoaderService
            .dataSub(`${ENTITY_NAME_VM_IMAGE}>dashboard>count_vm_image`)
            .subscribe((data) => {
                if (data && data > 0) {
                    setVmImages(data);
                }
            });

        return () => {
            vmImagesSub.unsubscribe();
        };
    }, [tenantUUID, serviceFactoryInstance.cache]);

    const handleCardClick = (entity) => {
        navigate(`/${entity}`);
    };

    return (
        <>
            <Grid item xs={12} sm={6} lg={3} onClick={() => handleCardClick('inventory')}>
                <Analytics title="Devices" count={devices} extra="Number of devices in platform" />
            </Grid>
            <Grid item xs={12} sm={6} lg={3} onClick={() => handleCardClick('vmimages')}>
                <Analytics title="VNF Images" count={vmImages} extra="Number of VNF images" />
            </Grid>
            <Grid item xs={12} sm={6} lg={3} onClick={() => handleCardClick('tenants')}>
                <Analytics title="Tenants" count={tenants} extra="Number of tenants" />
            </Grid>
            <Grid item xs={12} sm={6} lg={3} onClick={() => handleCardClickforJobs('jobs')}>
                <Analytics title="Jobs" count={jobs} extra="Number of picked jobs" />
            </Grid>
        </>
    );
};

export default AnalyticCardsChart;
