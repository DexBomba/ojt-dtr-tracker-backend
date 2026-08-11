import express from 'express';
import {
    getTargetHours,
    updateTargetHours,
    getDtrInfo,
    updateDtrInfo
} from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/target', authenticate, getTargetHours);
router.put('/target', authenticate, updateTargetHours);
router.get('/dtr-info', authenticate, getDtrInfo);
router.put('/dtr-info', authenticate, updateDtrInfo);

export default router;