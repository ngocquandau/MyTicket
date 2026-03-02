import express from 'express';
import { handleChat } from '../controllers/chatController.js'; 

const router = express.Router();

// Định nghĩa route cho tính năng chat
router.post('/', handleChat);

export default router;