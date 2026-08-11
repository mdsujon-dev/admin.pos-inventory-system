import type { Reducer } from "redux";
import {
  persistReducer,
  type PersistConfig,
  type PersistState,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { baseApi } from "../api/baseApi";
import authReducer, { type TAuthState } from "./auth/authSlice";
import notificationSoundReducer, {
  type NotificationSoundState,
} from "./notificationSound/notificationSoundSlice";
import sidebarReducer, { type SidebarState } from "./sidebar/sidebarSlice";

type Persisted<S> = S & { _persist: PersistState };

const authPersistConfig: PersistConfig<TAuthState> = {
  key: "auth",
  storage,
};

const sidebarPersistConfig: PersistConfig<SidebarState> = {
  key: "sidebar",
  storage,
  whitelist: ["isCollapsed"], // Only persist isCollapsed, not isActive (mobile state)
};

const notificationSoundPersistConfig: PersistConfig<NotificationSoundState> = {
  key: "notificationSound",
  storage,
};

const persistedAuthReducer = persistReducer(
  authPersistConfig,
  authReducer
) as Reducer<Persisted<TAuthState>>;

const persistedSidebarReducer = persistReducer(
  sidebarPersistConfig,
  sidebarReducer
) as Reducer<Persisted<SidebarState>>;

const persistedNotificationSoundReducer = persistReducer(
  notificationSoundPersistConfig,
  notificationSoundReducer
) as Reducer<Persisted<NotificationSoundState>>;

export const reducer = {
  [baseApi.reducerPath]: baseApi.reducer,
  auth: persistedAuthReducer,
  sidebar: persistedSidebarReducer,
  notificationSound: persistedNotificationSoundReducer,
};
