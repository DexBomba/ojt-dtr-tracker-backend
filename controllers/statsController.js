// controllers/statsController.js
import { query } from '../config/db.js';

// ===== GET SUMMARY STATISTICS =====
export const getSummary = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user with target hours
        const users = await query(
            'SELECT target_hours FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const targetHours = parseFloat(users[0].target_hours) || 500;

        // Get shift statistics
        const shifts = await query(
            `SELECT 
                COUNT(*) as totalShifts,
                COALESCE(SUM(total), 0) as totalHours,
                COALESCE(AVG(total), 0) as avgHours
            FROM shifts 
            WHERE user_id = ?`,
            [userId]
        );

        const totalShifts = shifts[0].totalShifts || 0;
        const totalHours = parseFloat(shifts[0].totalHours) || 0;
        const avgHours = parseFloat(shifts[0].avgHours) || 0;

        // Get unique days
        const daysResult = await query(
            'SELECT COUNT(DISTINCT date) as totalDays FROM shifts WHERE user_id = ?',
            [userId]
        );
        const totalDays = daysResult[0].totalDays || 0;

        // Calculate remaining and progress
        const remaining = Math.max(0, targetHours - totalHours);
        const progress = targetHours > 0 ? (totalHours / targetHours) * 100 : 0;
        const progressDisplay = Math.min(progress, 100);

        res.json({
            totalHours: Math.round(totalHours * 100) / 100,
            targetHours: targetHours,
            remaining: Math.round(remaining * 100) / 100,
            progress: Math.round(progressDisplay * 100) / 100,
            totalShifts: totalShifts,
            avgHours: Math.round(avgHours * 100) / 100,
            completionRate: Math.round(progressDisplay * 100) / 100,
            totalDays: totalDays
        });

    } catch (error) {
        console.error('Get summary stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};