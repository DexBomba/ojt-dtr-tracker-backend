// routes/exportRoutes.js
import express from 'express';
import {
    exportCSV,
    exportExcel,
    exportPDF
} from '../controllers/exportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Use POST to accept filtered shifts data
router.post('/csv', authenticate, exportCSV);
router.post('/excel', authenticate, exportExcel);
router.post('/pdf', authenticate, exportPDF);

export default router;
