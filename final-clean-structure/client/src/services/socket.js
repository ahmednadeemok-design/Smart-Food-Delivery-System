import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 8000,
  timeout: 10000,
  transports: ["websocket", "polling"],
  withCredentials: true,
});

let activeToken = "";

export const connectSocket = (token) => {
  if (!token) return socket.disconnect();
  if (socket.connected && activeToken === token) {
    socket.emit("join-role-rooms");
    return socket;
  }
  activeToken = token;
  socket.auth = { token };
  if (!socket.connected) socket.connect();
  socket.emit("join-role-rooms");
  return socket;
};

export const disconnectSocket = () => {
  activeToken = "";
  socket.disconnect();
};

export default socket;
