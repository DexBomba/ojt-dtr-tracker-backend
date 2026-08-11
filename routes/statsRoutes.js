// routes/statsRoutes.js
import express from 'express';
import { getSummary } from '../controllers/statsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', authenticate, getSummary);

export default router;