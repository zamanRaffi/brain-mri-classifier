"use client";

import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types/chat-socket";

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: ChatSocket | null = null;

/**
 * Returns a single shared Socket.IO connection for the whole tab.
 * The connection authenticates itself using the existing NextAuth session
 * cookie (sent automatically since we connect to the same origin).
 */
export function getSocket(): ChatSocket {
  if (!socket) {
    socket = io({
      path: "/api/socket.io",
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
}
