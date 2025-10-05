import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './routes/userRoutes.js';

const app = express();
app.use(express.json());

// Kết nối MongoDB
mongoose.connect('mongodb+srv://hoquanglong:MyTicket@cluster0.mbmb6yj.mongodb.net/myticket?retryWrites=true&w=majority&appName=Cluster0')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// Routes
app.use('/api/users', userRoutes);

// Khởi chạy server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
