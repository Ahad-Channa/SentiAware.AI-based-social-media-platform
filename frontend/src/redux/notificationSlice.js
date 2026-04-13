import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getNotifications, markNotificationRead } from '../api/api';

export const fetchNotifications = createAsyncThunk(
    'notifications/fetch',
    async (_, { rejectWithValue }) => {
        try {
            return await getNotifications();
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
        }
    }
);

export const markRead = createAsyncThunk(
    'notifications/markRead',
    async (id, { rejectWithValue }) => {
        try {
            return await markNotificationRead(id);
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
        }
    }
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState: {
        items: [],
        unreadCount: 0,
        loading: false,
        error: null,
    },
    reducers: {
        addNotification: (state, action) => {
            state.items.unshift(action.payload);
            state.unreadCount += 1;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
                state.unreadCount = action.payload.filter(n => !n.read).length;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(markRead.fulfilled, (state, action) => {
                const index = state.items.findIndex(n => n._id === action.payload._id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            });
    },
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
