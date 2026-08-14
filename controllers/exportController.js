// controllers/exportController.js
import { query } from '../config/db.js';

// Helper function to format time
function formatTime(timeStr) {
    if (!timeStr) return '--:-- --';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
}

// Helper to format date
function formatDate(dateStr) {
    if (!dateStr) return '--:-- --';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper to calculate duration
function calcDuration(inTime, outTime) {
    if (!inTime || !outTime) return 0;
    const [h1, m1] = inTime.split(':').map(Number);
    const [h2, m2] = outTime.split(':').map(Number);
    let diff = (h2 + m2/60) - (h1 + m1/60);
    if (diff < 0) diff += 24;
    return Math.round(diff * 100) / 100;
}

// ===== EXPORT CSV =====
export const exportCSV = async (req, res) => {
    try {
        const shifts = req.body.shifts;

        if (!shifts || shifts.length === 0) {
            return res.status(404).json({ message: 'No shifts to export' });
        }

        let csv = 'Date,Morning In,Morning Out,Morning Duration,Afternoon In,Afternoon Out,Afternoon Duration,Overtime Start,Overtime End,Overtime Duration,Total Hours\n';

        shifts.forEach(shift => {
            // Convert to numbers using parseFloat
            const mDur = parseFloat(calcDuration(shift.morning_in, shift.morning_out)) || 0;
            const aDur = parseFloat(calcDuration(shift.afternoon_in, shift.afternoon_out)) || 0;
            const oDur = parseFloat(calcDuration(shift.overtime_in, shift.overtime_out)) || 0;
            const total = parseFloat(shift.total) || 0;

            csv += `${shift.date},`;
            csv += `${shift.morning_in || ''},${shift.morning_out || ''},${mDur.toFixed(2)},`;
            csv += `${shift.afternoon_in || ''},${shift.afternoon_out || ''},${aDur.toFixed(2)},`;
            csv += `${shift.overtime_in || ''},${shift.overtime_out || ''},${oDur.toFixed(2)},`;
            csv += `${total.toFixed(2)}\n`;
        });

        // Get total hours from filtered shifts
        const totalHours = shifts.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);

        csv += `\nSummary,Total Hours: ${totalHours.toFixed(1)}\n`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=OJT_DTR_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('Export CSV error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== EXPORT EXCEL =====
export const exportExcel = async (req, res) => {
    try {
        const shifts = req.body.shifts;

        if (!shifts || shifts.length === 0) {
            return res.status(404).json({ message: 'No shifts to export' });
        }

        let html = `<html><head><meta charset="UTF-8"><title>OJT DTR</title></head><body>`;
        html += `<h2>OJT DTR Tracker</h2>`;
        html += `<table border="1" cellpadding="5" style="border-collapse:collapse;">`;
        html += `<tr>
            <th>Date</th>
            <th>Morning In</th>
            <th>Morning Out</th>
            <th>Morning Duration</th>
            <th>Afternoon In</th>
            <th>Afternoon Out</th>
            <th>Afternoon Duration</th>
            <th>Overtime Start</th>
            <th>Overtime End</th>
            <th>Overtime Duration</th>
            <th>Total Hours</th>
        </tr>`;

        shifts.forEach(shift => {
            const mDur = parseFloat(calcDuration(shift.morning_in, shift.morning_out)) || 0;
            const aDur = parseFloat(calcDuration(shift.afternoon_in, shift.afternoon_out)) || 0;
            const oDur = parseFloat(calcDuration(shift.overtime_in, shift.overtime_out)) || 0;
            const total = parseFloat(shift.total) || 0;

            html += `<tr>
                <td>${shift.date}</td>
                <td>${shift.morning_in || ''}</td>
                <td>${shift.morning_out || ''}</td>
                <td>${mDur.toFixed(2)}</td>
                <td>${shift.afternoon_in || ''}</td>
                <td>${shift.afternoon_out || ''}</td>
                <td>${aDur.toFixed(2)}</td>
                <td>${shift.overtime_in || ''}</td>
                <td>${shift.overtime_out || ''}</td>
                <td>${oDur.toFixed(2)}</td>
                <td>${total.toFixed(2)}</td>
            </tr>`;
        });

        const totalHours = shifts.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);

        html += `<tr><td colspan="10" style="text-align:right;font-weight:bold;">Total Hours:</td><td>${totalHours.toFixed(1)}</td></tr>`;
        html += `</table></body></html>`;

        res.setHeader('Content-Type', 'application/vnd.ms-excel');
        res.setHeader('Content-Disposition', `attachment; filename=OJT_DTR_${new Date().toISOString().split('T')[0]}.xls`);
        res.send(html);

    } catch (error) {
        console.error('Export Excel error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== EXPORT PDF (HTML version for print) =====
export const exportPDF = async (req, res) => {
    try {
        const shifts = req.body.shifts;
        const userId = req.user.id;

        if (!shifts || shifts.length === 0) {
            return res.status(404).json({ message: 'No shifts to export' });
        }

        // Get user info
        const users = await query(
            `SELECT name, email, full_name, school, department, company, position, supervisor, supervisor_title 
            FROM users WHERE id = ?`,
            [userId]
        );

        const user = users[0] || {};
        const fullName = user.full_name || user.name || 'N/A';

        const totalHours = shifts.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);

        // Build HTML for PDF
        let html = `
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>OJT DTR</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; }
                        h1 { text-align: center; color: #2c3e50; }
                        .header { text-align: center; color: #5d6d7e; margin-bottom: 30px; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th { background: #fdf6ec; padding: 10px; border: 1px solid #e8d5c4; text-align: left; }
                        td { padding: 8px 10px; border: 1px solid #e8d5c4; }
                        .total-row { font-weight: bold; }
                        .footer { margin-top: 30px; text-align: center; font-size: 0.8rem; color: #5d6d7e; border-top: 1px solid #e8d5c4; padding-top: 20px; }
                        .signature { margin-top: 40px; display: flex; justify-content: space-between; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; padding: 20px; background: #fdf6ec; border-radius: 8px; }
                        .info-grid div { padding: 4px 0; }
                        .info-label { font-weight: 600; color: #2c3e50; }
                    </style>
                </head>
                <body>
                    <h1>OJT DTR Tracker</h1>
                    <p class="header">Daily Time Record</p>
        `;

        // User info
        html += `
                    <div class="info-grid">
                        <div><span class="info-label">Full Name:</span> ${fullName}</div>
                        <div><span class="info-label">Email:</span> ${user.email || 'N/A'}</div>
                        <div><span class="info-label">School:</span> ${user.school || 'N/A'}</div>
                        <div><span class="info-label">Department:</span> ${user.department || 'N/A'}</div>
                        <div><span class="info-label">Company:</span> ${user.company || 'N/A'}</div>
                        <div><span class="info-label">Position:</span> ${user.position || 'N/A'}</div>
                    </div>
        `;

        // Table
        html += `
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Morning</th>
                                <th>Afternoon</th>
                                <th>Overtime</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        shifts.forEach(shift => {
            const mDur = parseFloat(calcDuration(shift.morning_in, shift.morning_out)) || 0;
            const aDur = parseFloat(calcDuration(shift.afternoon_in, shift.afternoon_out)) || 0;
            const oDur = parseFloat(calcDuration(shift.overtime_in, shift.overtime_out)) || 0;
            const total = parseFloat(shift.total) || 0;

            const morningStr = shift.morning_in && shift.morning_out ?
                `${formatTime(shift.morning_in)} - ${formatTime(shift.morning_out)} (${mDur.toFixed(2)} hrs)` :
                '-';
            const afternoonStr = shift.afternoon_in && shift.afternoon_out ?
                `${formatTime(shift.afternoon_in)} - ${formatTime(shift.afternoon_out)} (${aDur.toFixed(2)} hrs)` :
                '-';
            const otStr = shift.overtime_in && shift.overtime_out ?
                `${formatTime(shift.overtime_in)} - ${formatTime(shift.overtime_out)} (${oDur.toFixed(2)} hrs)` :
                '-';

            html += `
                <tr>
                    <td>${formatDate(shift.date)}</td>
                    <td>${morningStr}</td>
                    <td>${afternoonStr}</td>
                    <td>${otStr}</td>
                    <td style="font-weight:bold;">${total.toFixed(2)} hrs</td>
                </tr>
            `;
        });

        html += `
                            <tr style="font-weight:bold;background:#fdf6ec;">
                                <td colspan="4" style="text-align:right;">Total Hours:</td>
                                <td>${totalHours.toFixed(1)} hrs</td>
                            </tr>
                        </tbody>
                    </table>
        `;

        // Signature section
        html += `
                    <div class="signature">
                        <div>
                            <p><strong>Intern:</strong> ${fullName}</p>
                            <p style="margin-top:30px;">Signature: _______________________</p>
                            <p style="font-size:0.85rem;color:#5d6d7e;">Date: _______________</p>
                        </div>
                        <div style="text-align:right;">
                            <p><strong>Supervisor:</strong> ${user.supervisor || 'N/A'}</p>
                            <p><strong>Title:</strong> ${user.supervisor_title || 'N/A'}</p>
                            <p style="margin-top:30px;">Signature: _______________________</p>
                            <p style="font-size:0.85rem;color:#5d6d7e;">Date: _______________</p>
                        </div>
                    </div>
        `;

        html += `
                    <div class="footer">
                        This is an official DTR generated from OJT DTR Tracker (Academic Project).
                        <br>© 2026 OJT DTR Tracker — For Student Use
                    </div>
                </body>
            </html>
        `;

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename=OJT_DTR_${new Date().toISOString().split('T')[0]}.html`);
        res.send(html);

    } catch (error) {
        console.error('Export PDF error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
