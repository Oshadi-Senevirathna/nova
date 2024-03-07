// third-party
import { combineReducers } from 'redux';

// project import
import menu from './menu';
import selectedTenant from './selectedTenant';
import userUuid from './userUuid';

// ==============================|| COMBINE REDUCERS ||============================== //

const reducers = combineReducers({ menu, selectedTenant });

export default reducers;
