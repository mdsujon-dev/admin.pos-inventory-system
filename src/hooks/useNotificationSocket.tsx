import { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import { config } from "../config";
import { baseApi } from "../redux/api/baseApi";
import { useCurrentToken } from "../redux/features/auth/authSlice";
import { selectActiveSound } from "../redux/features/notificationSound/notificationSoundSlice";
import { useMyProfileQuery } from "../redux/features/user/userApi";
import { hasPermission } from "../utils/permission";
import {
  installAudioUnlock,
  playNotificationSound,
} from "../utils/playNotificationSound";

// Local to this hook — not exported, so the file only exports the hook
// (keeps react-refresh happy).
const SocketEvent = {
  CONNECTED: "socket:connected",
  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_READ: "notification:read",
  NOTIFICATION_READ_ALL: "notification:read-all",
} as const;

const stripTrailingApi = (url: string) =>
  url.replace(/\/api\/?$/, "").replace(/\/$/, "");

export const useNotificationSocket = () => {
  const token = useSelector(useCurrentToken);
  const dispatch = useDispatch();
  const socketRef = useRef<Socket | null>(null);

  const activeSound = useSelector(selectActiveSound);
  const activeSoundRef = useRef(activeSound);

  // Gate the bell refresh + sound on `Notifications / view` permission. Backend
  // broadcasts `notification:new` to every connected admin (so custom roles
  // like SUJON receive it once granted), but we don't want roles without view
  // permission to hear the sound — their GET requests would 403 silently.
  const { data: meRes } = useMyProfileQuery(undefined, { skip: !token });
  const canViewNotifications = useMemo(
    () =>
      hasPermission(
        {
          role: meRes?.data?.role,
          permissions: meRes?.data?.permissions,
        },
        "Notifications",
        "view"
      ),
    [meRes]
  );
  const canViewRef = useRef(canViewNotifications);

  useEffect(() => {
    activeSoundRef.current = activeSound;
  }, [activeSound]);

  useEffect(() => {
    canViewRef.current = canViewNotifications;
  }, [canViewNotifications]);

  // Arm the autoplay unlock as soon as the app mounts. The handler binds
  // one-shot listeners that resume the AudioContext on the first click /
  // keypress / touch — required by browsers before any audio can play.
  useEffect(() => {
    installAudioUnlock();
  }, []);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const baseUrl = stripTrailingApi(
      config.server_url || config.api_url || window.location.origin
    );

    const socket = io(baseUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socket.on(SocketEvent.NOTIFICATION_NEW, () => {
      // Skip everything for users without `Notifications / view` — their
      // GET requests would 403 silently and the sound would be misleading.
      if (!canViewRef.current) return;

      // Invalidate cached lists & unread count so the bell + dropdown refresh.
      dispatch(baseApi.util.invalidateTags(["notifications"]));

      // Only the user's chosen sound, if enabled.
      const sound = activeSoundRef.current;
      if (sound?.enabled) {
        playNotificationSound({
          name: sound.name,
          file: sound.file,
          volume: sound.volume,
        });
      }
    });

    socket.on(SocketEvent.NOTIFICATION_READ, () => {
      if (!canViewRef.current) return;
      dispatch(baseApi.util.invalidateTags(["notifications"]));
    });

    socket.on(SocketEvent.NOTIFICATION_READ_ALL, () => {
      if (!canViewRef.current) return;
      dispatch(baseApi.util.invalidateTags(["notifications"]));
    });

    socket.on("connect_error", (err: Error) => {
      // Silent in production — just log so the bell never blocks the UI.
      console.warn("[notification-socket] connect_error:", err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, dispatch]);

  return socketRef;
};
