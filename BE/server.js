import mongoose from 'mongoose';
import dns from 'node:dns/promises';
import app from './app.js';
import { startTicketCronJob } from './cron/ticketCron.js';

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 10000;

dns.setServers(['8.8.8.8']);

const startServer = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is missing in BE/.env');
    }

    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');

    startTicketCronJob();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

startServer();