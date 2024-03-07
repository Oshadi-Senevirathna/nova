import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import serviceFactoryInstance from 'framework/services/service-factory';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { ENTITY_NAME_COMPANY, ENTITY_NAME_USERS, ENTITY_NAME_USER_ROLES } from 'framework/caching/entity-cache';
// material-ui
import {
    Card,
    CardContent,
    Button,
    FormHelperText,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    OutlinedInput,
    Stack,
    Checkbox,
    FormControlLabel,
    FormGroup,
    TextField
} from '@mui/material';
// third party
import { Formik } from 'formik';
// project import
import AnimateButton from 'components/@extended/AnimateButton';
import CustomSnackbar from 'components/styledMUI/Snackbar';
import { Select, MenuItem } from '../../../node_modules/@mui/material/index';
import Multiselect from '../../../node_modules/multiselect-react-dropdown/dist/index';
import './style.css';
import * as Yup from 'yup';
// import userUUid, { setUserUUID } from '../../store/reducers/userUuid';
import { useDispatch, useSelector } from 'react-redux';
// import userUuid from '../../store/reducers/userUuid';
import { dispatch } from 'store/index';
import { useFormik } from 'formik';

// ============================|| FIREBASE - LOGIN ||============================ //

const DetailsPage = ({ title }) => {
    const [initialValues, setInitialValues] = useState({
        instance_name: '',
        email: '',
        first_name: '',
        last_name: '',
        old_pwd: '',
        new_pwd: '',
        new_pwd_re: '',
        company: '',
        roles: ''
    });

    const params = useParams();
    const dispatch = useDispatch();
    const [edit, setEdit] = useState(false);
    const [showOldPwd, setShowOldPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [showNewPwdRe, setShowNewPwdRe] = useState(false);
    const [changePwd, setChangePwd] = useState(false);
    const navigate = useNavigate();
    const [errorSnackbarMessage, setErrorSnackbarMessage] = useState('');
    const [successSnackbarMessage, setSuccessSnackbarMessage] = useState('');
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState();
    const [selectedTenants, setSelectedTenants] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [selectedRolesUUID, setSelectedRolesUUID] = useState();
    const [roles, setRoles] = useState([]);
    const [userRoleUUID, setuserRoleUUID] = useState([]);
    const [userRole, setuserRole] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [oldPwdError, setOldPwdError] = useState('');
    const [pwdMismatchError, setPwdMismatchError] = useState('');
    const [tempRoles, setTempRoles] = useState([]);

    useEffect(() => {
        document.title = title;
    }, []);

    useEffect(() => {
        const companiesSub = serviceFactoryInstance.dataLoaderService.dataSub(`${ENTITY_NAME_COMPANY}>summary`).subscribe((data) => {
            if (data) {
                setCompanies(data);
            }
        });
        serviceFactoryInstance.dataLoaderService
            .getRoles(ENTITY_NAME_USER_ROLES)
            .then((data) => {
                if (data && data.status && data.roles) {
                    console.log('setting roles', data.roles);
                    setRoles(data.roles);
                }
            })
            .catch((error) => {
                console.error('Error while fetching roles:', error);
                // Handle error
            })
            .finally(() => {
                setLoadingRoles(false); // Set loadingRoles to false once roles are loaded or there's an error
            });

        return () => {
            companiesSub.unsubscribe();
        };
    }, [serviceFactoryInstance.cache]);

    const UserRole = async (roleUUID) => {
        try {
            const data = await serviceFactoryInstance.dataLoaderService.getRoleName(ENTITY_NAME_USER_ROLES, roleUUID);

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

    useEffect(() => {
        const fetchRoleName = async () => {
            try {
                const roleName = await UserRole(userRoleUUID);
                setuserRole(roleName.roleName.roleName);
            } catch (error) {}
        };

        fetchRoleName();
    }, [userRoleUUID]);

    useEffect(() => {
        if (params.UUID !== undefined) {
            serviceFactoryInstance.dataLoaderService.getInstance(params.UUID, ENTITY_NAME_USERS).then((data) => {
                if (data.status) {
                    var temp = {};

                    temp['UUID'] = data.instance.UUID;
                    temp['instance_name'] = data.instance.instance_name;
                    temp['email'] = data.instance.email;
                    temp['first_name'] = data.instance.first_name;
                    temp['last_name'] = data.instance.last_name;
                    temp['roles'] = data.instance.roles;
                    temp['company'] = data.instance.company;
                    temp['old_pwd'] = '';
                    temp['new_pwd'] = '';
                    temp['new_pwd_re'] = '';

                    setInitialValues(temp);
                    setuserRoleUUID(data.instance.roles);
                    console.log('Roles in user details page', roles);
                    if (roles && roles.roles && roles.roles.length > 0 && data.instance.roles) {
                        var tempRoles = [];

                        for (let i = 0; i < roles.roles.length; i++) {
                            if (data.instance.roles.indexOf(roles.roles[i].UUID) > -1) {
                                tempRoles.push(roles.roles[i].UUID);
                            }
                        }
                        console.log('selected roles', tempRoles);
                        if (roles && roles.roles && roles.roles.length > 0 && data.instance.roles) {
                            setSelectedRoles(data.instance.roles); // Update selectedRoles directly
                        }
                    }

                    setSelectedTenants(data.instance.tenants ? data.instance.tenants : []);
                    getTenants(data.instance.company);
                }
            });
            setEdit(true);
        }
    }, [params.UUID, roles, dispatch]);

    // useEffect(() => {
    //     dispatch(
    //         setuserUuid({
    //             UUID: UserUUID
    //         })
    //     );
    // }, [UserUUID]);

    const getTenants = (UUID) => {
        serviceFactoryInstance.dataLoaderService.getInstance(UUID, ENTITY_NAME_COMPANY).then((data) => {
            if (data.status) {
                setTenants(data.instance && data.instance.tenants ? data.instance.tenants : []);
            }
        });
    };

    // const onSelect = (selectedList, selectedItem, setSelectedValues) => {
    //     setSelectedValues([...selectedList]);
    // };

    const onSelectfunc = (selectedList) => {
        setSelectedTenants([...selectedList]);
        // setSelectedRoles(selectedList);
    };

    const onRemove = (selectedList, removedItem, setSelectedValues) => {
        var selectedListTemp = [...selectedList];
        const position = selectedList.indexOf(removedItem);
        if (position !== -1) {
            selectedListTemp.splice(position, 1);
        }
        setSelectedValues(selectedListTemp);
    };

    return (
        <>
            <CustomSnackbar msg={successSnackbarMessage} onClose={() => setSuccessSnackbarMessage('')} severity="success" title="Success" />
            <CustomSnackbar msg={errorSnackbarMessage} onClose={() => setErrorSnackbarMessage('')} severity="error" title="Error" />
            <Card style={{ overflow: 'visible' }}>
                <CardContent>
                    <Formik
                        enableReinitialize
                        initialValues={initialValues}
                        validationSchema={Yup.object().shape({
                            instance_name: Yup.string().required('User Name is required'),
                            email: Yup.string().email('Invalid email address').required('Email is required'),
                            first_name: Yup.string().required('First Name is required'),
                            last_name: Yup.string().required('Last Name is required')
                        })}
                        onSubmit={async (values, { setErrors, setSubmitting }) => {
                            setSubmitting(true);
                            var pass = true;
                            var tempRoles = [];
                            console.log('selectedRoles', selectedRoles);
                            for (let i = 0; i < selectedRoles.length; i++) {
                                tempRoles.push(selectedRoles[i]);
                            }

                            const newTempRoles = selectedRoles.map((role) => role.UUID);
                            setTempRoles(newTempRoles);
                            console.log('tempRoles', newTempRoles);

                            var temp = {};

                            temp['instance_name'] = values.instance_name;
                            temp['email'] = values.email;
                            temp['first_name'] = values.first_name;
                            temp['last_name'] = values.last_name;
                            temp['company'] = values.company;
                            temp['tenants'] = selectedTenants;
                            temp['roles'] = tempRoles;
                            console.log('Form Data:', temp);

                            if (params.UUID && changePwd) {
                                if (values.new_pwd !== values.new_pwd_re) {
                                    setErrors({ new_pwd_re: 'Passwords should match' });
                                    pass = false;
                                    setSubmitting(false);
                                } else {
                                    temp['old_pwd'] = values.old_pwd;
                                    temp['new_pwd'] = values.new_pwd;
                                }
                            }
                            if (!params.UUID) {
                                temp['pwd'] = values.new_pwd;
                            }

                            console.log('Selected Roles:', selectedRoles);
                            if (pass) {
                                try {
                                    const data = params.UUID
                                        ? await serviceFactoryInstance.authService.updateUser({
                                              ...temp,
                                              UUID: params.UUID
                                          })
                                        : await serviceFactoryInstance.authService.addUser({ temp });
                                    console.log('API Response:', data);
                                    if (data.status) {
                                        setSubmitting(false);
                                        setSuccessSnackbarMessage(
                                            params.UUID ? 'Successfully edited the user' : 'Successfully added the user'
                                        );
                                    } else {
                                        if (data.reason === 'Incorrect old password') {
                                            setErrors({ old_pwd: 'Incorrect old password' });
                                        } else {
                                            setErrors({ submit: data.reason });
                                        }
                                        setSubmitting(false);
                                        setErrorSnackbarMessage(params.UUID ? 'User update failed' : 'User addition failed');
                                    }
                                } catch (reason) {
                                    setErrors({ submit: reason });
                                    setSubmitting(false);
                                    setErrorSnackbarMessage(params.UUID ? 'User update failed' : 'User addition failed');
                                }
                            }
                        }}
                    >
                        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values, resetForm }) => (
                            <form noValidate onSubmit={handleSubmit}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <Stack spacing={1}>
                                            <InputLabel htmlFor="user-form-instance_name">User Name</InputLabel>
                                            <OutlinedInput
                                                id="user-form-instance_name"
                                                type="text"
                                                value={values.instance_name}
                                                disabled={edit}
                                                name="instance_name"
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                placeholder="Enter username"
                                                fullWidth
                                                error={Boolean(touched.instance_name && errors.instance_name)}
                                            />
                                            {touched.instance_name && errors.instance_name && (
                                                <FormHelperText error id="standard-weight-helper-text-user-form-instance_name">
                                                    {errors.instance_name}
                                                </FormHelperText>
                                            )}
                                        </Stack>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Stack spacing={1}>
                                            <InputLabel htmlFor="user-form-email">
                                                Email<span style={{ color: 'red' }}>*</span>
                                            </InputLabel>
                                            <OutlinedInput
                                                id="user-form-email"
                                                type="text"
                                                value={values.email}
                                                name="email"
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                placeholder="Enter email"
                                                fullWidth
                                                error={Boolean(touched.email && errors.email)}
                                            />
                                            {touched.email && errors.email && (
                                                <FormHelperText error id="standard-weight-helper-text-user-form-email">
                                                    {errors.email}
                                                </FormHelperText>
                                            )}
                                        </Stack>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Stack spacing={1}>
                                            <InputLabel htmlFor="user-form-first_name">
                                                First Name<span style={{ color: 'red' }}>*</span>
                                            </InputLabel>
                                            <OutlinedInput
                                                id="user-form-first_name"
                                                type="text"
                                                value={values.first_name}
                                                name="first_name"
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                placeholder="Enter first name"
                                                fullWidth
                                                error={Boolean(touched.first_name && errors.first_name)}
                                            />
                                            {touched.first_name && errors.first_name && (
                                                <FormHelperText error id="standard-weight-helper-text-user-form-first_name">
                                                    {errors.first_name}
                                                </FormHelperText>
                                            )}
                                        </Stack>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Stack spacing={1}>
                                            <InputLabel htmlFor="user-form-last_name">
                                                Last Name<span style={{ color: 'red' }}>*</span>
                                            </InputLabel>
                                            <OutlinedInput
                                                id="user-form-last_name"
                                                type="text"
                                                value={values.last_name}
                                                name="last_name"
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                placeholder="Enter last name"
                                                fullWidth
                                                error={Boolean(touched.last_name && errors.last_name)}
                                            />
                                            {touched.last_name && errors.last_name && (
                                                <FormHelperText error id="standard-weight-helper-text-user-form-last_name">
                                                    {errors.last_name}
                                                </FormHelperText>
                                            )}
                                        </Stack>
                                    </Grid>
                                    {companies && (
                                        <Grid item xs={12}>
                                            <Stack spacing={1}>
                                                <InputLabel htmlFor="user-form-company">
                                                    Company<span style={{ color: 'red' }}>*</span>
                                                </InputLabel>
                                                <Select
                                                    id="user-form-company"
                                                    type="text"
                                                    value={values.company}
                                                    name="company"
                                                    onBlur={handleBlur}
                                                    onChange={(e) => {
                                                        handleChange(e);
                                                        getTenants(e.target.value);
                                                    }}
                                                    placeholder="Select company"
                                                    fullWidth
                                                    error={Boolean(touched.company && errors.company)}
                                                >
                                                    {companies
                                                        ? companies.map(
                                                              (company) =>
                                                                  company && (
                                                                      <MenuItem key={company.UUID} value={company.UUID}>
                                                                          {company.instance_name}
                                                                      </MenuItem>
                                                                  )
                                                          )
                                                        : ''}
                                                </Select>
                                                {touched.company && errors.company && (
                                                    <FormHelperText error id="standard-weight-helper-text-user-form-last_name">
                                                        {errors.company}
                                                    </FormHelperText>
                                                )}
                                            </Stack>
                                        </Grid>
                                    )}
                                    {tenants && (
                                        <Grid item xs={12}>
                                            <Stack spacing={1}>
                                                <InputLabel htmlFor="user-form-tenants">
                                                    Select tenants<span style={{ color: 'red' }}>*</span>
                                                </InputLabel>
                                                <Multiselect
                                                    showCheckbox={true}
                                                    options={tenants} // Options to display in the dropdown
                                                    selectedValues={selectedTenants} // Preselected value to persist in dropdown
                                                    onSelect={(selectedList, selectedItem) =>
                                                        onSelectfunc(selectedList, selectedItem, setSelectedTenants)
                                                    } // Function will trigger on select event
                                                    onRemove={(selectedList, removedItem) =>
                                                        onRemove(selectedList, removedItem, setSelectedTenants)
                                                    } // Function will trigger on remove event
                                                    displayValue="instance_name" // Property name to display in the dropdown options
                                                />
                                                {touched.tenants && errors.tenants && (
                                                    <FormHelperText error id="standard-weight-helper-text-user-form-last_name">
                                                        {errors.tenants}
                                                    </FormHelperText>
                                                )}
                                            </Stack>
                                        </Grid>
                                    )}

                                    {/* {roles && (
                                        <Grid item xs={12}>
                                            <Stack spacing={1}>
                                                <InputLabel htmlFor="user-form-roles">Select Roles</InputLabel>
                                                <Select
                                                    id="user-form-roles"
                                                    value={values.roles || []}
                                                    name="roles"
                                                    onBlur={handleBlur}
                                                    onChange={(e) => {
                                                        handleChange(e);
                                                    }}
                                                    placeholder="Select roles"
                                                    fullWidth
                                                    // multiple //  multiple selections
                                                    error={Boolean(touched.roles && errors.roles)}
                                                >
                                                    {roles && roles.roles
                                                        ? roles.roles.map((role) => (
                                                              <MenuItem key={role.UUID} value={role.UUID}>
                                                                  {role.instance_name}
                                                              </MenuItem>
                                                          ))
                                                        : null}
                                                </Select>
                                                {touched.roles && errors.roles && (
                                                    <FormHelperText error id="standard-weight-helper-text-user-form-roles">
                                                        {errors.roles}
                                                    </FormHelperText>
                                                )}
                                            </Stack>
                                        </Grid>
                                    )} */}
                                    {/* 
                                    { 2 roles && (
                                        <Grid item xs={12}>
                                            <Stack spacing={1}>
                                                <InputLabel htmlFor="user-form-roles">Select Roles</InputLabel>

                                                {userRole === 'Admin Role' || userRole === 'Insync Role' ? (
                                                    <Select
                                                        id="user-form-roles"
                                                        value={values.roles || []}
                                                        name="roles"
                                                        onBlur={handleBlur}
                                                        onChange={(e) => {
                                                            handleChange(e);
                                                        }}
                                                        placeholder="Select roles"
                                                        fullWidth
                                                        error={Boolean(touched.roles && errors.roles)}
                                                    >
                                                        {roles && roles.roles
                                                            ? roles.roles.map((role) => (
                                                                  <MenuItem key={role.UUID} value={role.UUID}>
                                                                      {role.instance_name}
                                                                  </MenuItem>
                                                              ))
                                                            : null}
                                                    </Select>
                                                ) : (
                                                    <TextField id="user-form-roles" value={userRole} disabled fullWidth />
                                                )}

                                                {touched.roles && errors.roles && (
                                                    <FormHelperText error id="standard-weight-helper-text-user-form-roles">
                                                        {errors.roles}
                                                    </FormHelperText>
                                                )}
                                            </Stack>
                                        </Grid>
                                    )} */}

                                    {roles && (
                                        <Grid item xs={12}>
                                            <Stack spacing={1}>
                                                <InputLabel htmlFor="user-form-roles">Select Roles</InputLabel>
                                                {userRole === 'Admin Role' || userRole === 'Insync Role' ? (
                                                    // <Multiselect
                                                    //     showCheckbox={true}
                                                    //     options={roles.roles} // Assuming roles.roles contains the available roles
                                                    //     selectedValues={selectedRoles.map((roleId) =>
                                                    //         roles.roles.find((role) => role.UUID === roleId)
                                                    //     )}
                                                    //     onSelect={(selectedList, selectedItem) => {
                                                    //         console.log('Selected Roles before update:', selectedRoles);
                                                    //         console.log('Newly selected roles:', selectedList);

                                                    //         // Update selectedRoles
                                                    //         setSelectedRoles(selectedList.map((role) => role.UUID));

                                                    //         console.log('Selected Roles after update:', selectedRoles);

                                                    //         // setSelectedRoles(selectedList);
                                                    //     }}
                                                    //     onRemove={(selectedList, removedItem) => {
                                                    //         // Handle removal logic if needed
                                                    //     }}
                                                    //     displayValue="instance_name"
                                                    // />
                                                    <Select
                                                        id="user-form-roles"
                                                        value={selectedRoles.length > 0 ? selectedRoles[0] : ''}
                                                        name="roles"
                                                        onBlur={handleBlur}
                                                        onChange={(e) => {
                                                            const selectedRole = e.target.value;
                                                            setSelectedRoles([selectedRole]);
                                                            handleChange(e);
                                                        }}
                                                        placeholder="Select role"
                                                        fullWidth
                                                        error={Boolean(touched.roles && errors.roles)}
                                                    >
                                                        {roles && roles.roles
                                                            ? roles.roles.map((role) => (
                                                                  <MenuItem key={role.UUID} value={role.UUID}>
                                                                      {role.instance_name}
                                                                  </MenuItem>
                                                              ))
                                                            : null}
                                                    </Select>
                                                ) : (
                                                    // {touched.roles && errors.roles && (
                                                    //     <FormHelperText error id="standard-weight-helper-text-user-form-roles">
                                                    //         {errors.roles}
                                                    //     </FormHelperText>
                                                    // )}

                                                    <TextField id="user-form-roles" value={userRole} disabled fullWidth />
                                                )}

                                                {touched.roles && errors.roles && (
                                                    <FormHelperText error id="standard-weight-helper-text-user-form-roles">
                                                        {errors.roles}
                                                    </FormHelperText>
                                                )}
                                            </Stack>
                                        </Grid>
                                    )}

                                    {params.UUID && (
                                        <Grid item xs={12}>
                                            <Stack spacing={1}>
                                                <FormGroup>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={changePwd}
                                                                onChange={() => {
                                                                    if (changePwd) {
                                                                        values.old_pwd = '';
                                                                        values.new_pwd = '';
                                                                        values.new_pwd_re = '';
                                                                    }
                                                                    setChangePwd(!changePwd);
                                                                }}
                                                            />
                                                        }
                                                        label="Change password"
                                                    />
                                                </FormGroup>
                                                {changePwd && (
                                                    <>
                                                        <Grid item xs={12}>
                                                            <Stack spacing={1}>
                                                                <InputLabel htmlFor="user-form-old-pwd">Old Password</InputLabel>
                                                                <OutlinedInput
                                                                    id="user-form-old-pwd"
                                                                    type={showOldPwd ? 'text' : 'password'}
                                                                    value={values.old_pwd}
                                                                    name="old_pwd"
                                                                    onBlur={handleBlur}
                                                                    onChange={handleChange}
                                                                    placeholder="Enter old password"
                                                                    fullWidth
                                                                    error={Boolean(touched.old_pwd && errors.old_pwd)}
                                                                    endAdornment={
                                                                        <InputAdornment position="end">
                                                                            <IconButton
                                                                                aria-label="toggle password visibility"
                                                                                onClick={() => setShowOldPwd(!showOldPwd)}
                                                                            >
                                                                                {showOldPwd ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                                                            </IconButton>
                                                                        </InputAdornment>
                                                                    }
                                                                />
                                                                {touched.old_pwd && errors.old_pwd && (
                                                                    <FormHelperText
                                                                        error
                                                                        id="standard-weight-helper-text-user-form-old-pwd"
                                                                    >
                                                                        {errors.old_pwd}
                                                                    </FormHelperText>
                                                                )}
                                                            </Stack>
                                                        </Grid>
                                                        <Grid item xs={12}>
                                                            <Stack spacing={1}>
                                                                <InputLabel htmlFor="user-form-new-pwd">New Password</InputLabel>
                                                                <OutlinedInput
                                                                    id="user-form-new-pwd"
                                                                    type={showNewPwd ? 'text' : 'password'}
                                                                    value={values.new_pwd}
                                                                    name="new_pwd"
                                                                    onBlur={handleBlur}
                                                                    onChange={handleChange}
                                                                    placeholder="Enter new password"
                                                                    fullWidth
                                                                    error={Boolean(touched.new_pwd && errors.new_pwd)}
                                                                    endAdornment={
                                                                        <InputAdornment position="end">
                                                                            <IconButton
                                                                                aria-label="toggle password visibility"
                                                                                onClick={() => setShowNewPwd(!showNewPwd)}
                                                                            >
                                                                                {showNewPwd ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                                                            </IconButton>
                                                                        </InputAdornment>
                                                                    }
                                                                />
                                                                {touched.new_pwd && errors.new_pwd && (
                                                                    <FormHelperText
                                                                        error
                                                                        id="standard-weight-helper-text-user-form-new-pwd"
                                                                    >
                                                                        {errors.new_pwd}
                                                                    </FormHelperText>
                                                                )}
                                                            </Stack>
                                                        </Grid>
                                                        <Grid item xs={12}>
                                                            <Stack spacing={1}>
                                                                <InputLabel htmlFor="user-form-new-pwd-re">
                                                                    Re-enter New Password
                                                                </InputLabel>
                                                                <OutlinedInput
                                                                    id="user-form-new-pwd-re"
                                                                    type={showNewPwdRe ? 'text' : 'password'}
                                                                    value={values.new_pwd_re}
                                                                    name="new_pwd_re"
                                                                    onBlur={handleBlur}
                                                                    onChange={handleChange}
                                                                    placeholder="Enter new password"
                                                                    fullWidth
                                                                    error={Boolean(touched.new_pwd_re && errors.new_pwd_re)}
                                                                    endAdornment={
                                                                        <InputAdornment position="end">
                                                                            <IconButton
                                                                                aria-label="toggle password visibility"
                                                                                onClick={() => setShowNewPwdRe(!showNewPwdRe)}
                                                                            >
                                                                                {showNewPwdRe ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                                                            </IconButton>
                                                                        </InputAdornment>
                                                                    }
                                                                />
                                                                {touched.new_pwd_re && errors.new_pwd_re && (
                                                                    <FormHelperText
                                                                        error
                                                                        id="standard-weight-helper-text-user-form-new-pwd-re"
                                                                    >
                                                                        {errors.new_pwd_re}
                                                                    </FormHelperText>
                                                                )}
                                                            </Stack>
                                                        </Grid>
                                                    </>
                                                )}
                                            </Stack>
                                        </Grid>
                                    )}
                                    {!params.UUID && (
                                        <Grid item xs={12}>
                                            <Stack spacing={1}>
                                                <Grid item xs={12}>
                                                    <Stack spacing={1}>
                                                        <InputLabel htmlFor="user-form-new-pwd">Password</InputLabel>
                                                        <OutlinedInput
                                                            id="user-form-new-pwd"
                                                            type={showNewPwd ? 'text' : 'password'}
                                                            value={values.new_pwd}
                                                            name="new_pwd"
                                                            onBlur={handleBlur}
                                                            onChange={handleChange}
                                                            placeholder="Enter new password"
                                                            fullWidth
                                                            error={Boolean(touched.new_pwd && errors.new_pwd)}
                                                            endAdornment={
                                                                <InputAdornment position="end">
                                                                    <IconButton
                                                                        aria-label="toggle password visibility"
                                                                        onClick={() => setShowNewPwd(!showNewPwd)}
                                                                    >
                                                                        {showNewPwd ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            }
                                                        />
                                                        {touched.new_pwd && errors.new_pwd && (
                                                            <FormHelperText error id="standard-weight-helper-text-user-form-new-pwd">
                                                                {errors.new_pwd}
                                                            </FormHelperText>
                                                        )}
                                                    </Stack>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Stack spacing={1}>
                                                        <InputLabel htmlFor="user-form-new-pwd-re">Re-enter Password</InputLabel>
                                                        <OutlinedInput
                                                            id="user-form-new-pwd-re"
                                                            type={showNewPwdRe ? 'text' : 'password'}
                                                            value={values.new_pwd_re}
                                                            name="new_pwd_re"
                                                            onBlur={handleBlur}
                                                            onChange={handleChange}
                                                            placeholder="Enter new password"
                                                            fullWidth
                                                            error={Boolean(touched.new_pwd_re && errors.new_pwd_re)}
                                                            endAdornment={
                                                                <InputAdornment position="end">
                                                                    <IconButton
                                                                        aria-label="toggle password visibility"
                                                                        onClick={() => setShowNewPwdRe(!showNewPwdRe)}
                                                                    >
                                                                        {showNewPwdRe ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            }
                                                        />
                                                        {touched.new_pwd_re && errors.new_pwd_re && (
                                                            <FormHelperText error id="standard-weight-helper-text-user-form-new-pwd-re">
                                                                {errors.new_pwd_re}
                                                            </FormHelperText>
                                                        )}
                                                    </Stack>
                                                </Grid>
                                            </Stack>
                                        </Grid>
                                    )}
                                    {errors.submit && (
                                        <Grid item xs={12}>
                                            <FormHelperText error>{errors.submit}</FormHelperText>
                                        </Grid>
                                    )}
                                    {params.UUID && (
                                        <Grid item xs={12} md={6}>
                                            <AnimateButton>
                                                <Button
                                                    disableElevation
                                                    disabled={isSubmitting}
                                                    fullWidth
                                                    size="large"
                                                    variant="contained"
                                                    color="primary"
                                                    type="submit"
                                                >
                                                    Save
                                                </Button>
                                            </AnimateButton>
                                        </Grid>
                                    )}
                                    {!params.UUID && (
                                        <>
                                            <Grid item xs={12} md={6}>
                                                <AnimateButton>
                                                    <Button
                                                        disableElevation
                                                        disabled={isSubmitting}
                                                        fullWidth
                                                        size="large"
                                                        type="submit"
                                                        variant="contained"
                                                        color="primary"
                                                    >
                                                        {!params.UUID ? 'Add' : 'Save'}
                                                    </Button>
                                                </AnimateButton>
                                            </Grid>
                                        </>
                                    )}
                                    <Grid item xs={12} md={6}>
                                        <AnimateButton>
                                            <Button
                                                onClick={() => {
                                                    resetForm();
                                                    /* editUnset(); */
                                                    /* if (!params.UUID) {
                                                                navigate(`/users`);
                                                            } */
                                                    navigate(`/users`);
                                                }}
                                                disableElevation
                                                fullWidth
                                                size="large"
                                                variant="contained"
                                                color="primary"
                                                type="button"
                                            >
                                                Cancel
                                            </Button>
                                        </AnimateButton>
                                    </Grid>
                                </Grid>
                            </form>
                        )}
                    </Formik>
                </CardContent>
            </Card>
        </>
    );
};

export default DetailsPage;
