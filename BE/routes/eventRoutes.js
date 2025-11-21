import express from 'express';
import {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent, 
  getTicketClassesByEvent
} from '../controllers/eventController.js';

import { verifyAdmin, verifyToken } from '../middleware/auth.js';


const router = express.Router();

router.post   ('/',     verifyToken, verifyAdmin, createEvent);
router.get    ('/',     getAllEvents);
router.get    ('/:id',  getEvent);
router.put    ('/:id',  verifyToken, verifyAdmin, updateEvent);
router.delete ('/:id',  verifyToken, verifyAdmin, deleteEvent);

router.get    ('/:id/tickets', getTicketClassesByEvent);

export default router;