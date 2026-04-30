const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");
const compression = require("compression");
const prisma = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

dotenv.config();

const socketService = require("./services/socketService");
const cronService = require("./services/cronService");

const app = express();
const server = http.createServer(app);

// Connect to Database
prisma.$connect()
  .then(() => console.log("✅ Prisma connected to Database"))
  .catch((err) => console.error("❌ Prisma connection error:", err));

// Initialize Services
const io = socketService.init(server);
app.set("io", io);
cronService.initOverdueCheck();

// Security Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(xss());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use("/api/", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/task-extras", require("./routes/taskExtras"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/activity", require("./routes/activity"));
app.use("/api/sprints", require("./routes/sprints"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/search", require("./routes/search"));

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "TaskFlow Enterprise API is running 🚀", version: "3.0.0" });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});
