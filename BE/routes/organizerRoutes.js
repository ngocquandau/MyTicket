import express from 'express';
import {
  getAllOrganizers,
  createOrganizer,
  updateOrganizer,
  deleteOrganizer,
  getOrganizer,
  getEventsByOrganizer,
  getOrganizerByUser
} from '../controllers/organizerController.js';

import { verifyAdmin, verifyToken } from '../middleware/auth.js';


const router = express.Router();

router.post   ('/',     verifyToken, verifyAdmin, createOrganizer);
router.get    ('/',     verifyToken, verifyAdmin, getAllOrganizers);

// Trả về organizer tương ứng với user từ token
router.get    ('/me',    verifyToken, getOrganizerByUser);

router.get    ('/:id',  getOrganizer);
router.put    ('/:id',  verifyToken, verifyAdmin, updateOrganizer);
router.delete ('/:id',  verifyToken, verifyAdmin, deleteOrganizer);

router.get    ('/:id/events', getEventsByOrganizer);

export default router;