"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "@/app/dashboard/_config";

export interface StaffPresenceEntry {
  userId: string;
  email: string;
  role: string;
  connectedAt: string;
}

export function useStaffPresence(accessToken: string | null): Set<string> {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setOnlineUserIds(new Set());
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("get_staff_presence");
    });

    socket.on("staff_presence", (entries: StaffPresenceEntry[]) => {
      setOnlineUserIds(new Set(entries.map((e) => e.userId)));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  return onlineUserIds;
}
