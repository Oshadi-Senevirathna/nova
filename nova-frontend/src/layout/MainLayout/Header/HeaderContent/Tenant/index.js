import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';
import serviceFactoryInstance from 'framework/services/service-factory';
// import { setSelectedTenant, setTenantDetails } from 'store/reducers/menu';
import selectedTenant, { setSelectedTenant } from 'store/reducers/selectedTenant';

import { ENTITY_NAME_USER_ROLES, ENTITY_NAME_USERS } from '../../../../../framework/caching/entity-cache';
// material-ui
import { useTheme } from '@mui/material/styles';
import {
    Box,
    ButtonBase,
    CardContent,
    ClickAwayListener,
    Grid,
    Paper,
    Popper,
    Stack,
    Typography,
    List,
    ListItemButton,
    ListItemText
} from '@mui/material';
// project import
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';
// assets
import { FilterFilled } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';

import { useParams } from '../../../../../../node_modules/react-router-dom/dist/index';

// tab panel wrapper
function TabPanel({ children, value, index, ...other }) {
    return (
        <div role="tabpanel" hidden={value !== index} id={`profile-tabpanel-${index}`} aria-labelledby={`profile-tab-${index}`} {...other}>
            {value === index && children}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired
};

function a11yProps(index) {
    return {
        id: `profile-tab-${index}`,
        'aria-controls': `profile-tabpanel-${index}`
    };
}

// ==============================|| HEADER CONTENT - PROFILE ||============================== //

const Tenant = () => {
    const theme = useTheme();
    const [tenant, setTenant] = useState();
    const [tenants, setTenants] = useState([]);
    const [userRoleUUID, setuserRoleUUID] = useState([]);
    const [userRole, setuserRole] = useState([]);

    const dispatch = useDispatch();
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUUID, setCurrentUUID] = useState();
    const { UUID } = useSelector((state) => state.selectedTenant);

    useEffect(() => {
        const userSubscription = serviceFactoryInstance.authService.getUserObservable().subscribe((user) => {
            setCurrentUser(user);
        });
        return () => {
            userSubscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (currentUser) {
            setCurrentUUID(currentUser.UUID);
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUUID !== 0) {
            serviceFactoryInstance.dataLoaderService.getInstance(currentUUID, ENTITY_NAME_USERS).then((data) => {
                if (data.status) {
                    console.log('Role', data.instance.roles);
                    setuserRoleUUID(data.instance.roles);
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
                return null;
            }
        } catch (error) {
            console.error('Error fetching role name:', error);
            throw error;
        }
    };

    // const TenantForUser = async (currentUUID) => {
    //     try {
    //         const data = serviceFactoryInstance.dataLoaderService.getTenant(ENTITY_NAME_USERS, currentUUID);

    //         // if (tenants && tenants.status) {
    //         //     console.log('tenants', tenants.Promise.tenants.instance_name);
    //         //     return tenants;
    //         // } else {
    //         //     return null;
    //         // }
    //         if (data) {
    //             console.log('DB', data);
    //             for (let i = 0; i < data.tenants.length; i++) {
    //                 if (data.tenants[i].UUID === 0) {
    //                     setTenant(data.tenants[i]);
    //                 }
    //             }
    //             console.log('Data tenants here', data.tenants);
    //             setTenants(data.tenants);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching tenant:', error);
    //         throw error;
    //     }
    // };
    const TenantForUser = async (currentUUID) => {
        if (tenant.UUID == 0) {
            try {
                serviceFactoryInstance.authService.getUserObservable().subscribe((data) => {
                    if (data) {
                        for (let i = 0; i < data.tenants.length; i++) {
                            if (data.tenants[i].UUID === 0) {
                                setTenant(data.tenants[i]);
                            }
                        }
                        console.log('Data tenants here', data.tenants);
                        setTenants(data.tenants);
                    }
                });
            } catch (error) {}
        } else {
            try {
                const data = await serviceFactoryInstance.dataLoaderService.getTenant(ENTITY_NAME_USERS, currentUUID);
                console.log('db', data);
                if (data && data.length > 0) {
                    const tenants = data;

                    setTenants(tenants);

                    tenants.forEach((tenant) => {
                        console.log('UUID:', tenant.UUID);
                        console.log('Instance Name:', tenant.instance_name);
                    });

                    // const tenantWithUUID0 = tenants.find((tenant) => tenant.UUID === 0);
                    // if (tenantWithUUID0) {
                    //     setTenant(tenantWithUUID0);

                    // }
                } else {
                    console.log('Invalid data structure or no tenants found:', data);
                }
                // if (data) {
                //     console.log('Data tenants here', data.tenants);
                //     setTenants(data);
                // }
            } catch (error) {
                console.error('Error fetching tenant:', error);
                throw error;
            }
        }
    };

    const TenantForSuperAdmin = async () => {
        try {
            serviceFactoryInstance.authService.getUserObservable().subscribe((data) => {
                if (data) {
                    for (let i = 0; i < data.tenants.length; i++) {
                        if (data.tenants[i].UUID === 0) {
                            setTenant(data.tenants[i]);
                        }
                    }
                    console.log('Data tenants here', data.tenants);
                    setTenants(data.tenants);
                }
            });
        } catch (error) {}
    };

    useEffect(() => {
        const fetchRoleName = async () => {
            try {
                const roleName = await UserRole(userRoleUUID);
                console.log('Role Name in tenant page:', roleName.roleName.roleName);
                setuserRole(roleName.roleName.roleName);
            } catch (error) {}
        };

        fetchRoleName();
    }, [userRoleUUID]);

    useEffect(() => {
        if (userRole == 'User Role' || userRole == 'Insync Role' || userRole == 'Admin Role') {
            TenantForUser(currentUUID);
        } else {
            TenantForSuperAdmin();
        }
    }, [userRole]);

    const handleSelect = (tenantSelect) => {
        if (tenantSelect.instance_name.toLowerCase() === 'all') {
            // If instance_name is "All", set tenantUUID to "0"
            tenantSelect.UUID = 0;
        }
        serviceFactoryInstance.authService.setTenant(tenantSelect);
        setTenant(tenantSelect);
        dispatch(
            setSelectedTenant({
                UUID: tenantSelect.UUID,
                instance_name: ''
            })
        );

        setOpen(false);
    };

    // const getTenantDetails = async () => {
    //     try {
    //         const response = await serviceFactoryInstance.dataLoaderService.getSelectedTenantDetails(UUID);

    //     } catch (error) {
    //         console.error('Error fetching tenant details:', error);
    //     }
    // };

    // useEffect(() => {
    //     if (UUID) {
    //         getTenantDetails();
    //     }
    // }, [UUID]);

    const anchorRef = useRef(null);
    const [open, setOpen] = useState(false);
    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return;
        }
        setOpen(false);
    };

    const iconBackColorOpen = 'grey.300';
    useEffect(() => {
        console.log(UUID);
    }, [UUID]);

    return (
        <Box sx={{ flexShrink: 0, ml: 0.75 }}>
            <ButtonBase
                sx={{
                    p: 0.25,
                    bgcolor: 'secondary.lighter',
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'secondary.light' }
                }}
                aria-label="open profile"
                ref={anchorRef}
                aria-controls={open ? 'profile-grow' : undefined}
                aria-haspopup="true"
                onClick={handleToggle}
            >
                <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 0.5 }}>
                    <FilterFilled />

                    {tenant ? (
                        <Typography variant="subtitle1">Tenant : {tenant.instance_name}</Typography>
                    ) : (
                        <Typography variant="subtitle1">Loading tenant</Typography>
                    )}
                </Stack>
            </ButtonBase>
            <Popper
                placement="bottom-end"
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
                popperOptions={{
                    modifiers: [
                        {
                            name: 'offset',
                            options: {
                                offset: [0, 9]
                            }
                        }
                    ]
                }}
            >
                {({ TransitionProps }) => (
                    <Transitions type="fade" in={open} {...TransitionProps}>
                        {open && (
                            <Paper
                                sx={{
                                    boxShadow: theme.customShadows.z1,
                                    width: 290,
                                    minWidth: 240,
                                    maxWidth: 290,
                                    [theme.breakpoints.down('md')]: {
                                        maxWidth: 250
                                    }
                                }}
                            >
                                <ClickAwayListener onClickAway={handleClose}>
                                    <MainCard elevation={0} border={false} content={false}>
                                        <CardContent sx={{ px: 2.5, pt: 3 }}>
                                            <Grid container justifyContent="space-between" alignItems="center">
                                                <Grid item>
                                                    <Stack direction="row" spacing={1.25} alignItems="center">
                                                        <Stack>
                                                            <Typography style={{ fontWeight: 'bold' }}>Select a tenant to view</Typography>
                                                        </Stack>
                                                    </Stack>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                        <>
                                            <List
                                                component="nav"
                                                sx={{
                                                    p: 0,
                                                    '& .MuiListItemIcon-root': { minWidth: 32, color: theme.palette.grey[500] }
                                                }}
                                            >
                                                {tenants && (
                                                    <>
                                                        {tenants.map((tenantSelect) => {
                                                            return (
                                                                <ListItemButton
                                                                    key={tenantSelect.UUID}
                                                                    onClick={() => handleSelect(tenantSelect)}
                                                                >
                                                                    <ListItemText primary={tenantSelect.instance_name} />
                                                                </ListItemButton>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </List>
                                        </>
                                    </MainCard>
                                </ClickAwayListener>
                            </Paper>
                        )}
                    </Transitions>
                )}
            </Popper>
        </Box>
    );
};

export default Tenant;
