import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { registerHandlers } from "./socket/handlers";
import { server as serverConfig } from "./config/server";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: serverConfig.cors,
});

io.on("connection", (socket) => {
  console.log(`[+] ${socket.id} connected`);
  registerHandlers(io, socket);
  socket.on("disconnect", () => console.log(`[-] ${socket.id} disconnected`));
});

httpServer.listen(serverConfig.port, () => {
  console.log(`Pattern Rush backend running on :${serverConfig.port}`);
});
