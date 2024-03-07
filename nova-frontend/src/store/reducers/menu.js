// types
import { createSlice } from '@reduxjs/toolkit';

// initial state
const initialState = {
    // selectedTenant: null,
    // selectedTenantDetails: null,
    openItem: ['dashboard'],
    openComponent: 'buttons',
    drawerOpen: false,
    componentDrawerOpen: true
};

// ==============================|| SLICE - MENU ||============================== //

const menu = createSlice({
    name: 'menu',
    initialState,
    reducers: {
        activeItem(state, action) {
            state.openItem = action.payload.openItem;
        },

        activeComponent(state, action) {
            state.openComponent = action.payload.openComponent;
        },

        openDrawer(state, action) {
            state.drawerOpen = action.payload.drawerOpen;
        },

        openComponentDrawer(state, action) {
            state.componentDrawerOpen = action.payload.componentDrawerOpen;
        }
        // setSelectedTenant(state, action) {
        //     state.selectedTenant = action.payload.selectedTenant;
        // },
        // setTenantDetails(state, action) {
        //     state.selectedTenantDetails = action.payload.selectedTenantDetails;
        // }
    }
});

export default menu.reducer;

export const { activeItem, activeComponent, openDrawer, openComponentDrawer } = menu.actions;
