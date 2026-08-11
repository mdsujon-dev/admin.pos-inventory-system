import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserRole } from "../../../data";
import { RootState } from "../store";
export interface IUser {
  email: string;
  name: string;
  role: UserRole;
  profilePhoto?: string;
  lastLogin: Date;
  isActive: boolean;
  /**
   * True while the account is still on the password it was issued with.
   * The panel puts a change-password dialog in front of everything until it
   * is cleared.
   */
  is_password_change?: boolean;
}
export interface TAuthState {
  user?: IUser | null;
  token?: string | null;
}

const initialState: TAuthState = {
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: IUser; token: string }>) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
    },
    setProfile: (state, action) => {
      if (state.user) {
        state.user.profilePhoto = action.payload;
      }
    },
    setRole: (state, action) => {
      if (state.user) {
        state.user.role = action.payload;
      }
    },
    // Called once the forced change succeeds, so the dialog stops blocking.
    clearPasswordChange: (state) => {
      if (state.user) {
        state.user.is_password_change = false;
      }
    },
  },
});

export const {
  setUser,
  logout,
  setProfile,
  setRole,
  clearPasswordChange,
} = authSlice.actions;
export default authSlice.reducer;

export const useCurrentToken = (state: RootState) => state.auth.token;
export const selectCurrentUser = (state: RootState) => state.auth.user;
