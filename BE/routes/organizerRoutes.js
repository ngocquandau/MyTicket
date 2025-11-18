import express from 'express';
import {
  getAllOrganizers,
  createOrganizer,
  updateOrganizer,
  deleteOrganizer,
  getOrganizer,
  getEventsByOrganizer
} from '../controllers/organizerController.js';

import { verifyAdmin, verifyToken } from '../middleware/auth.js';


const router = express.Router();

router.post   ('/',     verifyToken, verifyAdmin, createOrganizer);
router.get    ('/',     verifyToken, verifyAdmin, getAllOrganizers);
router.get    ('/:id',  getOrganizer);
router.put    ('/:id',  verifyToken, verifyAdmin, updateOrganizer);
router.delete ('/:id',  verifyToken, verifyAdmin, deleteOrganizer);

router.get    ('/:id/events', getEventsByOrganizer);

export default router;