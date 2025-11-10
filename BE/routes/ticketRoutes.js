import express from 'express';
import {
  getAllTicketClasses,
  updateTicket,
  deleteTicket,
  getTicket,
  createTicketClass
} from '../controllers/ticketController.js';

import { verifyAdmin, verifyToken } from '../middleware/auth.js';


const router = express.Router();

router.post('/', verifyToken, verifyAdmin, createTicketClass);
router.get('/', verifyToken, verifyAdmin, getAllTicketClasses);
router.get('/:id', verifyToken, getTicket);
router.put('/:id', verifyToken, verifyAdmin, updateTicket); // Chưa làm hạn chế fields chỉ admin mới được sửa
router.delete('/:id', verifyToken, verifyAdmin, deleteTicket);

// router.post('/add', verifyToken, verifyAdmin, createTicket);
// router.get('/view', verifyToken, verifyAdmin, getAllTickets);
// router.get('/view/:id', verifyToken, getTicket);
// router.put('/update/:id', verifyToken, verifyAdmin, updateTicket); // Chưa làm hạn chế fields chỉ admin mới được sửa
// router.delete('/delete/:id', verifyToken, verifyAdmin, deleteTicket);

export default router;