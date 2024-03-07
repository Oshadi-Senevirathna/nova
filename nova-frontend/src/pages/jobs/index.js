// import { makeStyles } from '../../../node_modules/@mui/styles/index';
// import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ENTITY_NAME_FRONTEND_JOBS } from 'framework/caching/entity-cache';
// import serviceFactoryInstance from 'framework/services/service-factory';
// import configs from './job-config.json';
// import ConfirmationDialog from 'components/styledMUI/confirmation-dialog';
// import CustomDatatable from 'components/styledMUI/Datatable';
// import moment from '../../../node_modules/moment/moment';
// import { useSelector } from 'react-redux';
// import { useLocation } from 'react-router-dom';
// const useStyles = makeStyles((theme) => ({
//     root: {
//         flexGrow: 1,
//         width: '100%',
//         margin: 0,
//         padding: 0
//     },
//     progressBar: {
//         marginTop: '20px',
//         marginBottom: '20px',
//         marginRight: '20px'
//     },
//     button: {
//         marginRight: '20px',
//         marginTop: '10px',
//         width: '120px'
//     },
//     iconbutton: {
//         marginRight: '20px',
//         marginTop: '10px',
//         width: '30px'
//     }
// }));

// const JobsPage = ({ title, selectedJobs }) => {
//     const classes = useStyles();
//     const navigate = useNavigate();
//     const [deleteUUIDS, setDeleteUUIDS] = useState([]);
//     const [confirmDeleteForm, setConfirmDeleteForm] = useState(false);
//     const [UUID, setUUID] = useState();
//     const [jobsSummary, setJobDetails] = useState();
//     const [deviceId, setDeviceId] = useState([]);
//     const tenantUUID = useSelector((state) => state.selectedTenant.UUID);
//     const location = useLocation();
//     const selectedDeviceIds = location.state?.selectedDeviceIds || [];

//     var configReshaped = configs;
//     for (let i = 0; i < configReshaped.fields.length; i++) {
//         if (configReshaped.fields[i].label === 'Created at') {
//             configReshaped.fields[i].options.customBodyRender = (value, tableMeta, updateValue) => {
//                 if (value) {
//                     value = String(new Date(value));
//                     value = moment(value).format('DD/MM/YYYY h:mm');
//                     return <>{value}</>;
//                 }
//             };
//         }
//     }

//     useEffect(() => {
//         document.title = title;
//     }, []);
//     // Filter jobs based on selected jobs

//     // useEffect(() => {
//     //     const jobsSummarySub = serviceFactoryInstance.dataLoaderService

//     //         .dataSub(`${ENTITY_NAME_FRONTEND_JOBS}>dashboard>jobs_status`)
//     //         .subscribe((data) => {
//     //             if (data) {
//     //                 console.log('DATA', data);
//     //                 setjobsSummary(data);
//     //             }
//     //         });

//     //     return () => {
//     //         jobsSummarySub.unsubscribe();
//     //     };
//     // }, [serviceFactoryInstance.cache]);
//     // ...

//     useEffect(() => {
//         const fetchJobDetails = async () => {
//             try {
//                 // Assuming your service method to fetch job details by IDs is named getJobDetailsByIds
//                 const jobs = await serviceFactoryInstance.dataLoaderService.getJobDetailsByDeviceIds(
//                     ENTITY_NAME_FRONTEND_JOBS,
//                     selectedDeviceIds
//                 );
//                 console.log('Got jobs', jobs);
//                 setJobDetails(jobs);
//             } catch (error) {
//                 console.error('Error fetching job details:', error);
//             }
//         };

//         if (selectedDeviceIds.length > 0) {
//             fetchJobDetails();
//         } else {
//             console.error('No selected jobs to display');
//         }
//     }, [selectedDeviceIds]);

//     console.log('Jobsummary', jobsSummary);
//     const getSummary = () => {
//         const numberWithCommas = (x) => {
//             if (x === undefined || x === null) {
//                 return '0';
//             }
//             return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
//         };

//         if (!jobsSummary || !Array.isArray(jobsSummary.jobDetails)) {
//             return [];
//         }

//         const jobDetails = jobsSummary.jobDetails;

//         const summary = jobDetails.reduce(
//             (accumulator, job) => {
//                 accumulator.total += 1;
//                 console.log('status', job.jobDetails);
//                 switch (job.status) {
//                     case 'JOB_PICKED':
//                         accumulator.jobPicked += 1;
//                         break;
//                     case 'NOT_STARTED':
//                         accumulator.notStarted += 1;
//                         break;
//                     case 'COMPLETED':
//                         accumulator.completed += 1;
//                         break;
//                     case 'FAILED':
//                         accumulator.failed += 1;
//                         break;
//                     case 'RUNNING':
//                         accumulator.running += 1;
//                         break;
//                     default:
//                         break;
//                 }

//                 return accumulator;
//             },
//             {
//                 jobPicked: 0,
//                 notStarted: 0,
//                 completed: 0,
//                 failed: 0,
//                 running: 0,
//                 total: 0
//             }
//         );

//         return [
//             { heading: 'Not started', value: numberWithCommas(summary.notStarted) },
//             { heading: 'Picked', value: numberWithCommas(summary.jobPicked) },
//             { heading: 'Running', value: numberWithCommas(summary.running) },
//             { heading: 'Completed', value: numberWithCommas(summary.completed) },
//             { heading: 'Failed', value: numberWithCommas(summary.failed) },
//             { heading: 'Total Jobs', value: numberWithCommas(summary.total) }
//         ];
//     };

//     // const getSummary = () => {
//     //     const numberWithCommas = (x) => {
//     //         if (x === undefined || x === null) {
//     //             return '0';
//     //         }
//     //         return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
//     //     };
//     //     var jobPicked = 0;
//     //     var notStarted = 0;
//     //     var completed = 0;
//     //     var failed = 0;
//     //     var running = 0;
//     //     var total = 0;

//     //     console.log('Summary get', jobsSummary.jobDetails);

//     //     // for (let i = 0; i < jobsSummary.jobDetails.length; i++) {
//     //     //     total += jobsSummary.jobDetails.status[i];
//     //     //     if (jobsSummary.status[i] === 'JOB_PICKED') {
//     //     //         jobPicked = jobsSummary.jobDetails.status[i];
//     //     //     }
//     //     //     if (jobsSummary.status[i] === 'NOT_STARTED') {
//     //     //         notStarted = jobsSummary.jobDetails.status[i];
//     //     //     }
//     //     //     if (jobsSummary.status[i] === 'COMPLETED') {
//     //     //         completed = jobsSummary.jobDetails.status[i];
//     //     //     }
//     //     //     if (jobsSummary.status[i] === 'FAILED') {
//     //     //         failed = jobsSummary.jobDetails.status[i];
//     //     //     }
//     //     //     if (jobsSummary.status[i] === 'RUNNING') {
//     //     //         running = jobsSummary.jobDetails.status[i];
//     //     //     }
//     //     // }

//     //     // return [
//     //     //     { heading: 'Not started', value: numberWithCommas(notStarted) },
//     //     //     { heading: 'Picked', value: numberWithCommas(jobPicked) },
//     //     //     { heading: 'Running', value: numberWithCommas(running) },
//     //     //     { heading: 'Completed', value: numberWithCommas(completed) },
//     //     //     { heading: 'Failed', value: numberWithCommas(failed) },
//     //     //     { heading: 'Total Jobs', value: numberWithCommas(total) }
//     //     // ];
//     // };

//     const deleteData = (rows) => {
//         for (let i = 0; i < rows.length; i++) {
//             const UUID = rows[i];
//             serviceFactoryInstance.dataLoaderService
//                 .deleteInstance(ENTITY_NAME_FRONTEND_JOBS, UUID)
//                 .then((data) => {
//                     if (data.status) {
//                         console.debug('Delete job successful');
//                     } else {
//                         console.debug('Delete job failed');
//                     }
//                 })
//                 .catch((reason) => {
//                     console.debug('Delete job failed');
//                 });
//         }
//     };

//     const handleDeleteOK = () => {
//         deleteData(deleteUUIDS);
//         setConfirmDeleteForm(false);
//     };

//     const handleDeleteCancel = () => {
//         setConfirmDeleteForm(false);
//     };

//     const navigateToPage = (param) => {
//         navigate(`/jobs/details/${param}`);
//     };

//     return (
//         <div className={classes.root}>
//             <ConfirmationDialog
//                 open={confirmDeleteForm}
//                 title="Delete Confirmation"
//                 message={
//                     (deleteUUIDS.length > 1 && `Are you sure you want to delete the tasks?`) ||
//                     (deleteUUIDS.length === 1 && `Are you sure you want to delete the task?`)
//                 }
//                 onOK={handleDeleteOK}
//                 onCancel={handleDeleteCancel}
//             />
//             <CustomDatatable
//                 entityName={ENTITY_NAME_FRONTEND_JOBS}
//                 configs={configReshaped}
//                 deleteData={deleteData}
//                 setUUID={setUUID}
//                 navigateToPage={navigateToPage}
//                 summary={jobsSummary && getSummary()}
//                 filter={true}
//             />
//         </div>
//     );
// };

// export default JobsPage;
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import serviceFactoryInstance from 'framework/services/service-factory';
import configs from './job-config.json';
import ConfirmationDialog from 'components/styledMUI/confirmation-dialog';

import moment from 'moment';
import { useSelector } from 'react-redux';
import { ENTITY_NAME_DEVICE, ENTITY_NAME_FRONTEND_JOBS, ENTITY_NAME_USERS } from 'framework/caching/entity-cache';
import { useLocation } from 'react-router-dom';
import { TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import CustomTable from './CustomTable';
import { all } from '../../../node_modules/axios/index';

const JobsPage = ({ title, selectedJobs }) => {
    const [deleteUUIDS, setDeleteUUIDS] = useState([]);
    const [confirmDeleteForm, setConfirmDeleteForm] = useState(false);
    const [UUID, setUUID] = useState();
    const [jobsSummary, setJobDetails] = useState();
    const tenantUUID = useSelector((state) => state.selectedTenant.UUID);
    const location = useLocation();
    const selectedDeviceIds = location.state?.selectedDeviceIds || [];
    const [defaultDeviceIds, setDefaultDeviceIds] = useState([]);
    const [currentUUID, setCurrentUUID] = useState();
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();
    useEffect(() => {
        document.title = title;
    }, []);
    console.log('SEPAAA', selectedDeviceIds);

    //getting current user
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
    console.log('current user', currentUUID);

    useEffect(() => {
        // const fetchJobDetails = async () => {
        //     try {
        //         const jobs = await serviceFactoryInstance.dataLoaderService.getJobDetailsByDeviceIds(
        //             ENTITY_NAME_FRONTEND_JOBS,
        //             selectedDeviceIds
        //         );
        //         setJobDetails(jobs);
        //     } catch (error) {
        //         console.error('Error fetching job details:', error);
        //     }
        // };
        const fetchJobDetails = async () => {
            console.log('selected device', selectedDeviceIds);
            if (selectedDeviceIds != 0) {
                const jobs = await serviceFactoryInstance.dataLoaderService.getJobDetailsByDeviceIds(
                    ENTITY_NAME_FRONTEND_JOBS,
                    selectedDeviceIds
                );
                setJobDetails(jobs);
            } else {
                const tenantUUIDfordevice = await serviceFactoryInstance.dataLoaderService.getTenantsUUIDByUser(
                    ENTITY_NAME_USERS,
                    currentUUID
                );
                const data = await serviceFactoryInstance.dataLoaderService.getDeviceCountByTenant(ENTITY_NAME_DEVICE, tenantUUIDfordevice);
                setDefaultDeviceIds(data.deviceIds);
                const alljobs = await serviceFactoryInstance.dataLoaderService.getJobDetailsByDeviceIds(
                    ENTITY_NAME_FRONTEND_JOBS,
                    defaultDeviceIds
                );
                console.log('All jobsss', defaultDeviceIds);
                setJobDetails(alljobs);
            }
        };

        if (selectedDeviceIds.length >= 0) {
            fetchJobDetails();
        } else {
            console.error('No selected jobs to display');
        }
    }, [selectedDeviceIds]);
    const getSummary = () => {
        const numberWithCommas = (x) => {
            if (x === undefined || x === null) {
                return '0';
            }
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        };

        if (!jobsSummary || !Array.isArray(jobsSummary.jobDetails)) {
            return [];
        }

        const jobDetails = jobsSummary.jobDetails;
        console.log('Details', jobDetails);
        const summary = jobDetails.reduce(
            (accumulator, job) => {
                accumulator.total += 1;

                const jobStatus = job.status || null;

                switch (jobStatus) {
                    case 'JOB_PICKED':
                        accumulator.jobPicked += 1;
                        break;
                    case 'NOT_STARTED':
                        accumulator.notStarted += 1;
                        break;
                    case 'COMPLETED':
                        accumulator.completed += 1;
                        break;
                    case 'FAILED':
                        accumulator.failed += 1;
                        break;
                    case 'RUNNING':
                        accumulator.running += 1;
                        break;
                    default:
                        // Treat unknown status as null
                        accumulator.unknownStatus += 1;
                        break;
                }

                return accumulator;
            },
            {
                jobPicked: 0,
                notStarted: 0,
                completed: 0,
                failed: 0,
                running: 0,
                unknownStatus: 0,
                total: 0
            }
        );

        return [
            { heading: 'Not started', value: numberWithCommas(summary.notStarted) },
            { heading: 'Picked', value: numberWithCommas(summary.jobPicked) },
            { heading: 'Running', value: numberWithCommas(summary.running) },
            { heading: 'Completed', value: numberWithCommas(summary.completed) },
            { heading: 'Failed', value: numberWithCommas(summary.failed) },
            { heading: 'Unknown Status', value: numberWithCommas(summary.unknownStatus) },
            { heading: 'Total Jobs', value: numberWithCommas(summary.total) }
        ];
    };

    const deleteData = (rows) => {
        for (let i = 0; i < rows.length; i++) {
            const UUID = rows[i];
            serviceFactoryInstance.dataLoaderService
                .deleteInstance(ENTITY_NAME_FRONTEND_JOBS, UUID)
                .then((data) => {
                    if (data.status) {
                        console.debug('Delete job successful');
                    } else {
                        console.debug('Delete job failed');
                    }
                })
                .catch((reason) => {
                    console.debug('Delete job failed');
                });
        }
    };

    const handleDeleteOK = () => {
        deleteData(deleteUUIDS);
        setConfirmDeleteForm(false);
    };

    const handleDeleteCancel = () => {
        setConfirmDeleteForm(false);
    };

    const navigateToPage = (param) => {
        navigate(`/jobs/details/${param}`);
    };
    console.log('Table data 1', jobsSummary && jobsSummary.jobDetails);
    return (
        <div>
            <ConfirmationDialog
                open={confirmDeleteForm}
                title="Delete Confirmation"
                message={
                    (deleteUUIDS.length > 1 && `Are you sure you want to delete the tasks?`) ||
                    (deleteUUIDS.length === 1 && `Are you sure you want to delete the task?`)
                }
                onOK={handleDeleteOK}
                onCancel={handleDeleteCancel}
            />

            <CustomTable
                entityName={ENTITY_NAME_FRONTEND_JOBS}
                configs={configs}
                deleteData={deleteData}
                setUUID={setUUID}
                navigateToPage={navigateToPage}
                data={jobsSummary && jobsSummary.jobDetails}
                summary={jobsSummary && getSummary()}
                filter={true}
            />
        </div>
    );
};

export default JobsPage;
