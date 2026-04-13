import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

export const fetchUnreadChatsCount = createAsyncThunk(
    'chat/fetchUnreadChatsCount',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/messages/unread-count');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread chats count');
        }
    }
);

const initialState = {
    unreadChatsCount: 0,
    loading: false,
    error: null,
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        decrementUnreadCount: (state, action) => {
            const amount = action.payload || 1;
            state.unreadChatsCount = Math.max(0, state.unreadChatsCount - amount);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUnreadChatsCount.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUnreadChatsCount.fulfilled, (state, action) => {
                state.loading = false;
                state.unreadChatsCount = action.payload.count;
            })
            .addCase(fetchUnreadChatsCount.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { decrementUnreadCount } = chatSlice.actions;

export default chatSlice.reducer;
