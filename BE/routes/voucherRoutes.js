import express from 'express';
import {
  getAllVouchers,
  updateVoucher,
  deleteVoucher,
  getVoucher,
  createVoucher
} from '../controllers/voucherController.js';

import { verifyAdmin, verifyToken } from '../middleware/auth.js';


const router = express.Router();

router.post   ('/',     verifyToken, verifyAdmin, createVoucher);
router.get    ('/',     verifyToken, verifyAdmin, getAllVouchers);
router.get    ('/:id',  getVoucher);
router.put    ('/:id',  verifyToken, verifyAdmin, updateVoucher);
router.delete ('/:id',  verifyToken, verifyAdmin, deleteVoucher);

export default router;