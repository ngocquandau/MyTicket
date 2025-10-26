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

import { verifyToken } from '../middleware/auth.js';


const router = express.Router();

router.get('/', verifyToken, getAllUsers);
router.post('/', createUser);
router.get('/profile', verifyToken, getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

router.post('/login', loginUser);
router.post('/logout', verifyToken, logoutUser);


export default router;
