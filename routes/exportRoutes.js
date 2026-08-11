// routes/exportRoutes.js
import express from 'express';
import {
    exportCSV,
    exportExcel,
    exportPDF
} from '../controllers/exportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/csv', authenticate, exportCSV);
router.get('/excel', authenticate, exportExcel);
router.get('/pdf', authenticate, exportPDF);

export default router;