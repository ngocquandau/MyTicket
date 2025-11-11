import express from 'express';
import {
  getAllTicketClasses,
  updateTicketClass,
  deleteTicketClass,
  getTicketClass,
  createTicketClass
} from '../controllers/ticketController.js';

import { verifyAdmin, verifyToken } from '../middleware/auth.js';


const router = express.Router();

router.post   ('/',     verifyToken, verifyAdmin, createTicketClass);
router.get    ('/',     verifyToken, verifyAdmin, getAllTicketClasses);
router.get    ('/:id',  getTicketClass);
router.put    ('/:id',  verifyToken, verifyAdmin, updateTicketClass);
router.delete ('/:id',  verifyToken, verifyAdmin, deleteTicketClass);

export default router;