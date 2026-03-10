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
import statisticRoutes from './routes/statisticRoutes.js';

import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Cấu hình DNS để tránh lỗi không thể kết nối đến MongoDB
import dns from "node:dns/promises";
dns.setServers(["8.8.8.8"]); 

const app = express();

// --- MIDDLEWARE (ĐÃ SỬA LẠI CORS VÀ JSON) ---
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Hỗ trợ nhận diện form-data từ Webhook (nếu có)

// Cấu hình CORS cực kỳ quan trọng để Vercel gọi được Render
app.use(cors({
    origin: [
        'https://mticket.vercel.app', // Tên miền Production trên Vercel của bạn
        'http://localhost:3000'       // Tên miền Development (Local)
    ],
    credentials: true // Bắt buộc phải có dòng này để gửi kèm Token/Cookie khi đăng nhập
}));
// --------------------------------------------

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 10000; // Render thường dùng port 10000

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
app.use('/api/statistic',   statisticRoutes); 

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
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

startServer();