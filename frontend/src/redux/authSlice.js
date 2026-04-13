import { createSlice } from "@reduxjs/toolkit";

// Start with null user by default
const initialState = {
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload)); // optional persistence
    },
    logout: (state) => {
      state.user = null;
      localStorage.removeItem("user");
    },
    loadUserFromStorage: (state) => {
      const user = localStorage.getItem("user");
      if (user) state.user = JSON.parse(user);
    },
    updateProfile: (state, action) => {
      // Merge updated fields into existing user
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    addFriendLocally: (state, action) => {
      if (state.user) {
        if (!state.user.friends) state.user.friends = [];
        if (!state.user.friends.includes(action.payload)) {
          state.user.friends.push(action.payload);
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      }
    },
    removeFriendLocally: (state, action) => {
      if (state.user && state.user.friends) {
        state.user.friends = state.user.friends.filter(id => id !== action.payload);
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
  },
});

export const { loginSuccess, logout, loadUserFromStorage, updateProfile, addFriendLocally, removeFriendLocally } = authSlice.actions;
export default authSlice.reducer;
