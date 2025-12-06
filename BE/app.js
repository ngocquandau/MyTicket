import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors'; 

import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import organizerRoutes from './routes/organizerRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import voucherRoutes from './routes/voucherRoutes.js';
import interactionRoutes from './routes/interactionRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js'; // Mới
import paymentRoutes from './routes/paymentRoutes.js';   // Mới
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // Cho phép Frontend (localhost:3001...) gọi API

// Kết nối MongoDB (Dùng biến môi trường cho an toàn)
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://hoquanglong:MyTicket@cluster0.mbmb6yj.mongodb.net/myticket?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(' MongoDB Connection Error:', err));

// Routes
app.use('/api/user', userRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/ticket', ticketRoutes);
app.use('/api/voucher', voucherRoutes);
app.use('/api/interaction', interactionRoutes);
app.use('/api/purchases', purchaseRoutes); // Đổi tên cho chuẩn RESTful
app.use('/api/payment', paymentRoutes);

// Route mặc định kiểm tra server
app.get('/', (req, res) => {
  res.send('MyTicket API is running...');
});

// Khởi chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});