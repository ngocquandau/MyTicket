import express from 'express';
import {
  getAllInteractions,
  updateInteraction,
  deleteInteraction,
  getInteraction,
  createInteraction
} from '../controllers/interactionController.js';

import { verifyAdmin, verifyToken } from '../middleware/auth.js';


const router = express.Router();

router.post   ('/',     verifyToken, verifyAdmin, createInteraction);
router.get    ('/',     verifyToken, verifyAdmin, getAllInteractions);
router.get    ('/:id',  getInteraction);
router.put    ('/:id',  verifyToken, verifyAdmin, updateInteraction);
router.delete ('/:id',  verifyToken, verifyAdmin, deleteInteraction);

export default router;