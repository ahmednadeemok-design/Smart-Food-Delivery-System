import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 800,
});

export const connectSocket = (token) => {
  if (!token) return socket.disconnect();
  socket.auth = { token };
  if (!socket.connected) socket.connect();
  socket.emit("join-role-rooms");
  return socket;
};

export const disconnectSocket = () => {
  socket.removeAllListeners();
  socket.disconnect();
};

export default socket;
