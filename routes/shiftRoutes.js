// routes/shiftRoutes.js
import express from 'express';
import {
    getShifts,
    getShiftById,
    createShift,
    updateShift,
    deleteShift
} from '../controllers/shiftController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getShifts);
router.get('/:id', authenticate, getShiftById);
router.post('/', authenticate, createShift);
router.put('/:id', authenticate, updateShift);
router.delete('/:id', authenticate, deleteShift);

export default router;