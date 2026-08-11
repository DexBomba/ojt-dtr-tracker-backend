// controllers/shiftController.js
import { query } from '../config/db.js';

// ===== GET ALL SHIFTS =====
export const getShifts = async (req, res) => {
    try {
        const userId = req.user.id;
        const shifts = await query(
            'SELECT * FROM shifts WHERE user_id = ? ORDER BY date DESC',
            [userId]
        );
        res.json({ shifts });
    } catch (error) {
        console.error('Get shifts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== GET SHIFT BY ID =====
export const getShiftById = async (req, res) => {
    try {
        const userId = req.user.id;
        const shiftId = req.params.id;

        const shifts = await query(
            'SELECT * FROM shifts WHERE id = ? AND user_id = ?',
            [shiftId, userId]
        );

        if (shifts.length === 0) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        res.json({ shift: shifts[0] });

    } catch (error) {
        console.error('Get shift error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== CREATE SHIFT =====
export const createShift = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            date,
            morning_in,
            morning_out,
            afternoon_in,
            afternoon_out,
            overtime_in,
            overtime_out,
            total
        } = req.body;

        // Validate
        if (!date || !morning_in || !morning_out || !afternoon_in || !afternoon_out) {
            return res.status(400).json({ message: 'Please provide date and all required times' });
        }

        if (total === undefined || total === null) {
            return res.status(400).json({ message: 'Please provide total hours' });
        }

        const result = await query(
            `INSERT INTO shifts 
            (user_id, date, morning_in, morning_out, afternoon_in, afternoon_out, overtime_in, overtime_out, total) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, date, morning_in, morning_out, afternoon_in, afternoon_out, overtime_in || null, overtime_out || null, total]
        );

        const newShift = await query(
            'SELECT * FROM shifts WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            message: 'Shift created successfully',
            shift: newShift[0]
        });

    } catch (error) {
        console.error('Create shift error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== UPDATE SHIFT =====
export const updateShift = async (req, res) => {
    try {
        const userId = req.user.id;
        const shiftId = req.params.id;
        const {
            date,
            morning_in,
            morning_out,
            afternoon_in,
            afternoon_out,
            overtime_in,
            overtime_out,
            total
        } = req.body;

        // Check if shift exists and belongs to user
        const existing = await query(
            'SELECT * FROM shifts WHERE id = ? AND user_id = ?',
            [shiftId, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        await query(
            `UPDATE shifts SET 
                date = ?, 
                morning_in = ?, 
                morning_out = ?, 
                afternoon_in = ?, 
                afternoon_out = ?, 
                overtime_in = ?, 
                overtime_out = ?, 
                total = ? 
            WHERE id = ? AND user_id = ?`,
            [date, morning_in, morning_out, afternoon_in, afternoon_out, overtime_in || null, overtime_out || null, total, shiftId, userId]
        );

        const updatedShift = await query(
            'SELECT * FROM shifts WHERE id = ?',
            [shiftId]
        );

        res.json({
            message: 'Shift updated successfully',
            shift: updatedShift[0]
        });

    } catch (error) {
        console.error('Update shift error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== DELETE SHIFT =====
export const deleteShift = async (req, res) => {
    try {
        const userId = req.user.id;
        const shiftId = req.params.id;

        // Check if shift exists and belongs to user
        const existing = await query(
            'SELECT * FROM shifts WHERE id = ? AND user_id = ?',
            [shiftId, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        await query('DELETE FROM shifts WHERE id = ? AND user_id = ?', [shiftId, userId]);

        res.json({ message: 'Shift deleted successfully' });

    } catch (error) {
        console.error('Delete shift error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};