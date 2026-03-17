import express from 'express';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUser,
  loginUser,
  logoutUser,
  getMyOrganizations,
  getNewPassword
} from '../controllers/userController.js';

import { verifyAdmin, verifyToken } from '../middleware/auth.js';


const router = express.Router();

router.get('/my-organizations', verifyToken, getMyOrganizations);

router.post   ('/',         createUser);
router.get    ('/',         verifyToken, verifyAdmin, getAllUsers);
router.get    ('/profile',  verifyToken, getUser);
router.get    ('/:id',      verifyToken, verifyAdmin, getUser);
router.put    ('/profile',  verifyToken, updateUser);
router.put    ('/:id',      verifyToken, verifyAdmin, updateUser);
router.delete ('/:id',      verifyToken, verifyAdmin, deleteUser);

router.post   ('/login',    loginUser);
router.post   ('/logout',   verifyToken, logoutUser);

router.post('/forgot-password', getNewPassword); 

export default router;