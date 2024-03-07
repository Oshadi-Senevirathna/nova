//define initial state

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    UUID: 0
};

const userUuid = createSlice({
    name: 'userUuid',
    initialState,
    reducers: {
        setUserUUID(state, action) {
            state.UUID = action.payload?.UUID ?? null;
            // state.UUID = action.payload.UUID;
        }
    }
});

export default userUuid.reducer;

export const { setUserUUID } = userUuid.actions;
