import express from 'express';
// Import fungsi spesifik dari controller (bukan * as Controller)
import { loginUser, logoutUser, getMe } from '../controllers/authController.js';
// Import middleware
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ===================================================================
//  PUBLIC ROUTES (Tidak butuh login)
// ===================================================================
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// ===================================================================
//  PRIVATE ROUTES (Butuh Token)
// ===================================================================
router.get('/me', protect, getMe);

export default router;