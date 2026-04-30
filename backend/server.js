const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const prisma = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

// Connect to Database
prisma.$connect()
  .then(() => console.log('✅ Prisma connected to Database'))
  .catch((err) => console.error('❌ Prisma connection error:', err));

const app = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: false }));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Compression
app.use(compression());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'TaskFlow API is running 🚀', version: '2.0.0' });
});

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
// Mount task extras on /api/tasks (for comments + subtasks via /:id/...)
app.use('/api/tasks', require('./routes/taskExtras'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/sprints', require('./routes/sprints'));
app.use('/api/search', require('./routes/search'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global Error Handler
app.use(errorHandler);

const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
});

// Socket logic
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('join-project', (projectId) => {
    socket.join(`project:${projectId}`);
    console.log(`👤 User joined project: ${projectId}`);
  });

  socket.on('leave-project', (projectId) => {
    socket.leave(`project:${projectId}`);
  });

  socket.on('task-updated', (data) => {
    // Broadcast to others in the same project
    socket.to(`project:${data.projectId}`).emit('task-synced', data);
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected');
  });
});

// Make io accessible in routes
app.set('io', io);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
