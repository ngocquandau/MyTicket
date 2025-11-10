import express from 'express';
import {
  getAllOrganizers,
  createOrganizer,
  updateOrganizer,
  deleteOrganizer,
  getOrganizer
} from '../controllers/organizerController.js';

import { verifyAdmin, verifyToken } from '../middleware/auth.js';


const router = express.Router();

router.post('/', verifyToken, verifyAdmin, createOrganizer);
router.get('/', verifyToken, verifyAdmin, getAllOrganizers);
router.get('/:id', verifyToken, getOrganizer);
router.put('/:id', updateOrganizer); // Chưa làm hạn chế fields chỉ admin mới được sửa
router.delete('/:id', verifyToken, verifyAdmin, deleteOrganizer);

export default router;