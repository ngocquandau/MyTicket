import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors'; 
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import organizerRoutes from './routes/organizerRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import voucherRoutes from './routes/voucherRoutes.js';
import interactionRoutes from './routes/interactionRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js'; 
import paymentRoutes from './routes/paymentRoutes.js';  
import emailRoutes from './routes/emailRoutes.js'; 
import imageRoutes from './routes/imageRoutes.js';
import chatRoutes from './routes/chatRoutes.js'; 

import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

// Routes
app.use('/api/user',        userRoutes);
app.use('/api/event',       eventRoutes);
app.use('/api/organizer',   organizerRoutes);
app.use('/api/ticket',      ticketRoutes);
app.use('/api/voucher',     voucherRoutes);
app.use('/api/interaction', interactionRoutes);
app.use('/api/purchases',   purchaseRoutes); 
app.use('/api/payment',     paymentRoutes);
app.use('/api/email',       emailRoutes);
app.use('/api/image',       imageRoutes);
app.use('/api/chat',        chatRoutes); 

// Route mặc định kiểm tra server
app.get('/', (req, res) => {
  res.send('MyTicket API is running...');
});

// Khởi chạy server sau khi DB sẵn sàng
const startServer = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is missing in BE/.env');
    }

    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

startServer();