//define initial state

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    UUID: 0,
    instance_name: 'Select'
};

const selectedTenant = createSlice({
    name: 'selectedTenant',
    initialState,
    reducers: {
        setSelectedTenant(state, action) {
            state.instance_name = action.payload?.instance_name ?? null;
            state.UUID = action.payload.UUID;
        }
    }
});

export default selectedTenant.reducer;

export const { setSelectedTenant } = selectedTenant.actions;
