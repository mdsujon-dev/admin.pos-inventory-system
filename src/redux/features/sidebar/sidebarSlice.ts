import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SidebarState {
  isActive: boolean;
  isCollapsed: boolean;
}

const initialState: SidebarState = {
  isActive: false,
  isCollapsed: false,
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isActive = !state.isActive;
    },
    closeSidebar: (state) => {
      state.isActive = false;
    },
    openSidebar: (state) => {
      state.isActive = true;
    },
    toggleCollapse: (state) => {
      state.isCollapsed = !state.isCollapsed;
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload;
    },
    setSidebarState: (state, action: PayloadAction<Partial<SidebarState>>) => {
      return { ...state, ...action.payload };
    },
    resetSidebarState: () => {
      return {
        isActive: false,
        isCollapsed: false,
      };
    },
  },
});

export const {
  toggleSidebar,
  closeSidebar,
  openSidebar,
  toggleCollapse,
  setCollapsed,
  setSidebarState,
  resetSidebarState,
} = sidebarSlice.actions;

export default sidebarSlice.reducer;
export type { SidebarState };