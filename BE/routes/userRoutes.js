import express from 'express';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUser,
  loginUser,
  logoutUser
} from '../controllers/userController.js';

import { verifyAdmin, verifyToken } from '../middleware/auth.js';


const router = express.Router();

router.get('/', verifyToken, verifyAdmin, getAllUsers);
router.post('/', createUser);
router.get('/profile', verifyToken, getUser);
router.put('/:id', updateUser); // Chưa làm hạn chế fields chỉ admin mới được sửa
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);

router.post('/login', loginUser);
router.post('/logout', verifyToken, logoutUser);


export default router;
