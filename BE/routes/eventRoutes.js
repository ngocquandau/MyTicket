import express from 'express';
import {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent
} from '../controllers/eventController.js';

import { verifyAdmin, verifyToken } from '../middleware/auth.js';


const router = express.Router();

router.post('/', verifyToken, verifyAdmin, createEvent);
router.get('/', verifyToken, verifyAdmin, getAllEvents);
router.get('/:id', verifyToken, getEvent);
router.put('/:id', updateEvent); // Chưa làm hạn chế fields chỉ admin mới được sửa
router.delete('/:id', verifyToken, verifyAdmin, deleteEvent);

export default router;