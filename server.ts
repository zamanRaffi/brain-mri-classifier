import "dotenv/config";
import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { getToken } from "next-auth/jwt";
import { prisma } from "./src/lib/prisma";
import type {
  ChatMessagePayload,
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./src/types/chat-socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = Number(process.env.PORT) || 3000;
const SOCKET_PATH = "/api/socket.io";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory presence tracking. userId -> number of live connections
// (a user can have several tabs/devices open at once).
const onlineUsers = new Map<string, number>();
// Small grace period before broadcasting "offline", so a page refresh
// (disconnect immediately followed by reconnect) doesn't flicker the status.
const offlineTimers = new Map<string, ReturnType<typeof setTimeout>>();
const OFFLINE_GRACE_MS = 4000;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    // Let Socket.IO's own listener (registered below) handle its path;
    // everything else goes through Next.js as usual.
    if (req.url?.startsWith(SOCKET_PATH)) return;
    const parsedUrl = parse(req.url ?? "/", true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    path: SOCKET_PATH,
  });

  // Authenticate every socket using the existing NextAuth session cookie —
  // no separate login step needed on the client.
  io.use(async (socket, next) => {
    try {
      const token = await getToken({
        // getToken only needs `.headers` to read + verify the session cookie.
        req: { headers: socket.handshake.headers } as never,
        secret: process.env.AUTH_SECRET,
      });

      const userId = token?.id as string | undefined;
      if (!userId) {
        next(new Error("Unauthorized"));
        return;
      }

      socket.data.userId = userId;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);

    const pendingOffline = offlineTimers.get(userId);
    if (pendingOffline) {
      clearTimeout(pendingOffline);
      offlineTimers.delete(userId);
    }

    const wasOffline = !onlineUsers.has(userId);
    onlineUsers.set(userId, (onlineUsers.get(userId) ?? 0) + 1);

    // Tell the newly connected client who is currently online.
    socket.emit("presence:list", Array.from(onlineUsers.keys()));
    if (wasOffline) {
      socket.broadcast.emit("presence:online", userId);
    }

    socket.on("chat:send", async (payload, ack) => {
      const content = payload?.content?.trim();
      const receiverId = payload?.receiverId;

      if (!content || !receiverId) {
        ack?.(null);
        return;
      }

      try {
        // Only allow messaging when a CONFIRMED appointment exists between the two users
        const appointment = await prisma.appointment.findFirst({
          where: {
            status: "CONFIRMED",
            patientId: { in: [userId, receiverId] },
            doctorId: { in: [userId, receiverId] },
          },
        });

        if (!appointment) {
          socket.emit("chat:error", { message: "No confirmed appointment between users." });
          ack?.(null);
          return;
        }

        const saved = await prisma.chatMessage.create({
          data: { senderId: userId, receiverId, content },
        });

        const message: ChatMessagePayload = {
          id: saved.id,
          senderId: saved.senderId,
          receiverId: saved.receiverId,
          content: saved.content,
          createdAt: saved.createdAt.toISOString(),
          read: saved.read,
        };

        // Deliver to every open tab of both participants.
        io.to(`user:${message.senderId}`)
          .to(`user:${message.receiverId}`)
          .emit("chat:message", message);

        ack?.(message);
      } catch (err) {
        console.error("chat:send failed", err);
        socket.emit("chat:error", { message: "Failed to send message." });
        ack?.(null);
      }
    });

    socket.on("chat:typing", ({ receiverId, isTyping }) => {
      if (!receiverId) return;
      io.to(`user:${receiverId}`).emit("chat:typing", {
        senderId: userId,
        isTyping: !!isTyping,
      });
    });

    socket.on("chat:read", async ({ otherUserId }) => {
      if (!otherUserId) return;
      try {
        await prisma.chatMessage.updateMany({
          where: { senderId: otherUserId, receiverId: userId, read: false },
          data: { read: true },
        });
        io.to(`user:${otherUserId}`).emit("chat:read", {
          readerId: userId,
          otherUserId,
        });
      } catch (err) {
        console.error("chat:read failed", err);
      }
    });

    socket.on("disconnect", () => {
      const remaining = (onlineUsers.get(userId) ?? 1) - 1;
      if (remaining <= 0) {
        onlineUsers.delete(userId);
        const timer = setTimeout(() => {
          offlineTimers.delete(userId);
          if (!onlineUsers.has(userId)) {
            io.emit("presence:offline", userId);
          }
        }, OFFLINE_GRACE_MS);
        offlineTimers.set(userId, timer);
      } else {
        onlineUsers.set(userId, remaining);
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
