// controllers/settingsController.js
import { query } from '../config/db.js';

// ===== GET TARGET HOURS =====
export const getTargetHours = async (req, res) => {
    try {
        const userId = req.user.id;
        const users = await query(
            'SELECT target_hours FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ targetHours: users[0].target_hours });

    } catch (error) {
        console.error('Get target hours error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== UPDATE TARGET HOURS =====
export const updateTargetHours = async (req, res) => {
    try {
        const userId = req.user.id;
        const { targetHours } = req.body;

        if (targetHours === undefined || targetHours === null) {
            return res.status(400).json({ message: 'Please provide target hours' });
        }

        if (targetHours < 1) {
            return res.status(400).json({ message: 'Target hours must be at least 1' });
        }

        await query(
            'UPDATE users SET target_hours = ? WHERE id = ?',
            [targetHours, userId]
        );

        res.json({
            message: 'Target hours updated successfully',
            targetHours: targetHours
        });

    } catch (error) {
        console.error('Update target hours error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== GET DTR INFO =====
export const getDtrInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const users = await query(
            `SELECT 
                full_name, 
                school, 
                department, 
                company, 
                position, 
                supervisor, 
                supervisor_title 
            FROM users 
            WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ dtrInfo: users[0] });

    } catch (error) {
        console.error('Get DTR info error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== UPDATE DTR INFO =====
export const updateDtrInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            fullName,
            school,
            department,
            company,
            position,
            supervisor,
            supervisorTitle
        } = req.body;

        await query(
            `UPDATE users SET 
                full_name = ?,
                school = ?,
                department = ?,
                company = ?,
                position = ?,
                supervisor = ?,
                supervisor_title = ?
            WHERE id = ?`,
            [
                fullName || null,
                school || null,
                department || null,
                company || null,
                position || null,
                supervisor || null,
                supervisorTitle || null,
                userId
            ]
        );

        res.json({ message: 'DTR info updated successfully' });

    } catch (error) {
        console.error('Update DTR info error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};