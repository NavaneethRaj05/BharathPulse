const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const connectDB = require('./config/db');
const complaintRoutes = require('./routes/complaintRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const { setSocket } = require('./controllers/complaintControllerV2');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT'] },
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/complaints', complaintRoutes);
app.use('/api/chatbot', chatbotRoutes);

io.on('connection', (socket) => {
  socket.on('complaint:join', (complaintId) => {
    if (complaintId) socket.join(`complaint:${complaintId}`);
  });
  socket.on('complaint:leave', (complaintId) => {
    if (complaintId) socket.leave(`complaint:${complaintId}`);
  });
});

setSocket(io);

// Base route
app.get('/', (req, res) => {
  res.send('CivicPulse API is running');
});

// Centralized error handler to avoid opaque "Submission failed" on frontend
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'Image must be 5MB or smaller.' });
    }
    return res.status(400).json({ success: false, error: err.message });
  }
  if (err) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
  return next();
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
