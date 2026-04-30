let io;

const init = (server) => {
  const { Server } = require("socket.io");
  io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL || "http://localhost:5173", "http://localhost:3000"],
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-project", (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`User ${socket.id} joined project: ${projectId}`);
    });

    socket.on("leave-project", (projectId) => {
      socket.leave(`project:${projectId}`);
      console.log(`User ${socket.id} left project: ${projectId}`);
    });

    socket.on("typing", ({ projectId, userName }) => {
      socket.to(`project:${projectId}`).emit("user-typing", { userName });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

// Helper to emit to a specific project room
const emitToProject = (projectId, event, data) => {
  if (io) {
    io.to(`project:${projectId}`).emit(event, data);
  }
};

module.exports = {
  init,
  getIO,
  emitToProject
};
