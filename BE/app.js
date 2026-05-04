import express from 'express';
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
import modelRoutes from './routes/modelRoutes.js';   
import reviewRoutes from './routes/reviewRoutes.js'; 

import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// --- MIDDLEWARE ---
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// Cấu hình CORS
app.use(cors({
    origin: [
        'https://mticket.vercel.app', 
        'http://localhost:3000'       
    ],
    credentials: true 
}));

// --- ROUTES ---
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
app.use('/api/model',       modelRoutes);   
app.use('/api/review',      reviewRoutes);  

// Route mặc định kiểm tra server
app.get('/', (req, res) => {
  res.send('MyTicket API is running...');
});

export default app;