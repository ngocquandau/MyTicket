import express from 'express';
import {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent, 
  getTicketClassesByEvent,
  autoUpdateEventStatus
} from '../controllers/eventController.js';

import { verifyAdmin, verifyToken, optionalAuth } from '../middleware/auth.js';
import { verifyCronService } from '../middleware/verify-cron.js';

const router = express.Router();

router.post   ('/',     verifyToken, verifyAdmin, createEvent);
router.get    ('/',     getAllEvents);
router.get    ('/:id',  optionalAuth, getEvent);
router.put    ('/:id',  verifyToken, verifyAdmin, updateEvent);
router.delete ('/:id',  verifyToken, verifyAdmin, deleteEvent);

router.get    ('/:id/tickets', getTicketClassesByEvent);
router.post   ('/auto-update-status', verifyCronService, autoUpdateEventStatus);

export default router;
