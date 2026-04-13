import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import friendsReducer from "./friendsSlice";
import notificationReducer from "./notificationSlice";
import chatReducer from './chatSlice';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    friends: friendsReducer,
    notifications: notificationReducer,
    chat: chatReducer,
  },
});
