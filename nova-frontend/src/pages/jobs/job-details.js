// import { useEffect, useState } from 'react';
// import { useParams } from 'react-router-dom';
// import serviceFactoryInstance from 'framework/services/service-factory';
// import { LinearProgress } from '../../../node_modules/@mui/material/index';
// import { ENTITY_NAME_FRONTEND_JOBS } from 'framework/caching/entity-cache';
// import { Card, CardContent } from '../../../node_modules/@mui/material/index';
// // material-ui
// import { Grid, Typography } from '@mui/material';
// // third party
// // project import

// // ============================|| FIREBASE - LOGIN ||============================ //

// const DetailsPage = ({ title }) => {
//     const [job, setJob] = useState();
//     const params = useParams();

//     useEffect(() => {
//         document.title = title;
//     }, []);

//     useEffect(() => {
//         const jobsSub = serviceFactoryInstance.dataLoaderService.dataSub(ENTITY_NAME_FRONTEND_JOBS).subscribe((data) => {
//             if (data && params.UUID) {
//                 var job = data.filter((jobTemp) => {
//                     return jobTemp.UUID === params.UUID;
//                 });
//                 if (job.length === 1) {
//                     setJob(job[0]);
//                 }
//             }
//         });
//         return () => {
//             jobsSub.unsubscribe();
//         };
//     }, [params.UUID, serviceFactoryInstance.cache]);

//     const runJob = () => {
//         serviceFactoryInstance.dataLoaderService
//             .runjob(job.UUID)
//             .then((data) => {
//                 if (data.status) {
//                     console.debug('Run request success');
//                 } else {
//                     console.debug('Run request failed');
//                 }
//             })
//             .catch((reason) => {
//                 console.debug('Run request failed');
//             });
//     };
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import serviceFactoryInstance from 'framework/services/service-factory';
import { LinearProgress } from '@mui/material';
import { ENTITY_NAME_DEVICE, ENTITY_NAME_FRONTEND_JOB, ENTITY_NAME_FRONTEND_JOBS } from 'framework/caching/entity-cache';
import { Card, CardContent } from '@mui/material';
import { Grid, Typography } from '@mui/material';

const DetailsPage = ({ title }) => {
    const [job, setJob] = useState();
    const params = useParams();
    const [DeviceIdname, setDeviceIdname] = useState([]);
    const [DeviceId, setDeviceId] = useState([]);
    const [jobUUID, setJobUUID] = useState();

    useEffect(() => {
        document.title = title;
    }, []);

    useEffect(() => {
        const fetchJobDetails = async () => {
            try {
                const jobs = await serviceFactoryInstance.dataLoaderService.getDataById(ENTITY_NAME_FRONTEND_JOBS, params.UUID);
                if (jobs.length === 1) {
                    setJob(jobs[0]);

                    // Extract device ID from the job details
                    const deviceId = jobs[0].arguments?.device_id;

                    if (deviceId) {
                        setDeviceId(deviceId);

                        // Fetch device names using the device ID
                        getdeviceIdFortheJobId(deviceId);
                    }
                }
            } catch (error) {
                console.error('Error fetching job details:', error);
            }
        };

        fetchJobDetails();
    }, [params.UUID, serviceFactoryInstance.cache]);

    const getdeviceIdFortheJobId = async (deviceId) => {
        try {
            const idsnames = await serviceFactoryInstance.dataLoaderService.getDevicenameByDeviceID(ENTITY_NAME_DEVICE, deviceId);
            setDeviceIdname(idsnames);
            console.log('deviceId names', idsnames);
        } catch (error) {
            console.error('Error fetching device IDs names by deviceid:', error);
        }
    };

    useEffect(() => {
        // const jobsSub = serviceFactoryInstance.dataLoaderService.dataSub(ENTITY_NAME_FRONTEND_JOBS).subscribe((data) => {
        //     if (data && params.UUID) {
        //         var job = data.filter((jobTemp) => {
        //             setDeviceId(jobTemp.arguments.deviceId);
        //             return jobTemp.UUID === params.UUID;
        //         });
        //         if (job.length === 1) {
        //             setJob(job[0]);
        //         }
        //     }
        // });
    }, [params.UUID, serviceFactoryInstance.cache]);

    // const FetchdeviceName = async (deviceId) => {
    //     try {
    //         const idsnames = await serviceFactoryInstance.dataLoaderService.getDevicenameByDeviceID(ENTITY_NAME_DEVICE, DeviceId);
    //         setDeviceIdname(idsnames);
    //         console.log('deviceId names', idsnames);
    //     } catch (error) {
    //         console.error('Error fetching device IDs  names by deviceid:', error);
    //     }
    // };
    // useEffect(() => {
    //

    // });

    const runJob = () => {
        serviceFactoryInstance.dataLoaderService
            .runjob(job.UUID)
            .then((data) => {
                if (data.status) {
                    console.debug('Run request success');
                } else {
                    console.debug('Run request failed');
                }
            })
            .catch((reason) => {
                console.debug('Run request failed');
            });
    };
    return (
        <>
            {job && (
                <Card>
                    <CardContent>
                        <Grid container spacing={3}>
                            <Grid item xs={6}>
                                <Typography variant="subtitle1">Job Name:</Typography>
                                <Typography>{job.job_name || 'N/A'}</Typography>
                            </Grid>

                            <Grid item xs={6}>
                                <Typography variant="subtitle1">Job ID:</Typography>
                                <Typography>{job.UUID || 'N/A'}</Typography>
                            </Grid>

                            <Grid item xs={6}>
                                <Typography variant="subtitle1">Batch Number:</Typography>
                                <Typography>{job.batch_no || 'N/A'}</Typography>
                            </Grid>

                            <Grid item xs={6}>
                                <Typography variant="subtitle1">Device Names:</Typography>
                                {DeviceIdname && DeviceIdname.length > 0 ? (
                                    <ul>
                                        {[...new Set(DeviceIdname)].map((deviceName, index) => (
                                            <li key={index}>{deviceName}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <Typography>No device names available</Typography>
                                )}
                            </Grid>

                            <Grid item xs={6}>
                                <Typography variant="subtitle1">Status:</Typography>
                                <Typography>{job.status || 'N/A'}</Typography>
                            </Grid>

                            <Grid item xs={6}>
                                <Typography variant="subtitle1">Errors:</Typography>
                                <Typography>{job.error || 'N/A'}</Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="subtitle1">Job Progress:</Typography>
                                {job.status === 'RUNNING' || job.status === 'COMPLETED' ? (
                                    <>
                                        <LinearProgress variant="determinate" value={job.job_progress || 0} />
                                        <Typography component={'span'} variant="body2" color="textSecondary">{`${Math.round(
                                            job.job_progress ? job.job_progress : 0
                                        )}% COMPLETE`}</Typography>
                                    </>
                                ) : (
                                    <Typography>No progress information available</Typography>
                                )}
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}
        </>
    );

    // return (
    //     <>
    //         {job && (
    //             <Card>
    //                 <CardContent>
    //                     <Grid container spacing={3}>
    //                         <Grid item xs={4}>
    //                             <Typography variant="subtitle1">Job Name</Typography>
    //                         </Grid>
    //                         <Grid item xs={8}>
    //                             <Typography>{job.job_name ? job.job_name : ''}</Typography>
    //                         </Grid>

    //                         <Grid item xs={4}>
    //                             <Typography variant="subtitle1">ID</Typography>
    //                         </Grid>
    //                         <Grid item xs={8}>
    //                             <Typography>{job.UUID ? job.UUID : ''}</Typography>
    //                         </Grid>

    //                         <Grid item xs={4}>
    //                             <Typography variant="subtitle1">Batch Number</Typography>
    //                         </Grid>
    //                         <Grid item xs={8}>
    //                             <Typography>{job.batch_no ? job.batch_no : ''}</Typography>
    //                         </Grid>
    //                         {/* device id */}
    //                         {/* <Grid item xs={4}>
    //                             <Typography variant="subtitle1">HostName</Typography>
    //                         </Grid> */}
    //                         <Grid item xs={8}>
    //                             {DeviceIdname && DeviceIdname.length > 0 ? (
    //                                 <div>
    //                                     <Typography variant="subtitle1">Device Names:</Typography>
    //                                     <ul>
    //                                         {[...new Set(DeviceIdname)].map((deviceName, index) => (
    //                                             <li key={index}>{deviceName}</li>
    //                                         ))}
    //                                     </ul>
    //                                 </div>
    //                             ) : (
    //                                 <Typography>No device names available</Typography>
    //                             )}
    //                         </Grid>

    //                         <Grid item xs={8}>
    //                             <Typography>{DeviceIdname ? DeviceIdname : ''}</Typography>
    //                         </Grid>
    //                         <Grid item xs={4}>
    //                             <Typography variant="subtitle1">Status</Typography>
    //                         </Grid>
    //                         <Grid item xs={8}>
    //                             <Typography>{job.status ? job.status : ''}</Typography>
    //                         </Grid>

    //                         <Grid item xs={4}>
    //                             <Typography variant="subtitle1">Errors</Typography>
    //                         </Grid>

    //                         <Grid item xs={8}>
    //                             <Typography>{job.error ? job.error : ''}</Typography>
    //                         </Grid>

    //                         <Grid item xs={12} md={12}>
    //                             {job.status === 'RUNNING' || job.status === 'COMPLETED' ? (
    //                                 <div>
    //                                     <Typography>Ongoing job progress</Typography>
    //                                     {job.job_progress === 0 || !job.job_progress ? (
    //                                         <LinearProgress />
    //                                     ) : (
    //                                         <LinearProgress variant="determinate" value={job.job_progress} />
    //                                     )}
    //                                     <Typography component={'span'} variant="body2" color="textSecondary">{`${Math.round(
    //                                         job.job_progress ? job.job_progress : 0
    //                                     )}% COMPLETE`}</Typography>
    //                                 </div>
    //                             ) : (
    //                                 <div>
    //                                     <LinearProgress variant="determinate" value={0} />
    //                                     <Typography component={'span'} variant="body2" color="textSecondary">{`${Math.round(
    //                                         0
    //                                     )}% COMPLETE`}</Typography>
    //                                 </div>
    //                             )}
    //                         </Grid>
    //                     </Grid>
    //                 </CardContent>
    //             </Card>
    //         )}
    //     </>
    // );
};

export default DetailsPage;
