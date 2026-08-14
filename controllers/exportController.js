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

// ===== EXPORT PDF =====
export const exportPDF = async (req, res) => {
    try {
        const shifts = req.body.shifts;
        const userId = req.user.id;

        if (!shifts || shifts.length === 0) {
            return res.status(404).json({ message: 'No shifts to export' });
        }

        // Get user info
        const users = await query(
            `SELECT name, email, full_name, school, department, company, position, supervisor, supervisor_title, target_hours
            FROM users WHERE id = ?`,
            [userId]
        );

        const user = users[0] || {};
        const fullName = user.full_name || user.name || 'N/A';

        // Calculate totals
        const totalHours = shifts.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
        const targetHours = parseFloat(user.target_hours) || 500;
        const remaining = Math.max(0, targetHours - totalHours);
        const progress = targetHours > 0 ? (totalHours / targetHours) * 100 : 0;

        // Determine date range
        const dates = shifts.map(s => new Date(s.date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const dateRange = `${minDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${maxDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

        // Get current date for footer (server time)
        const now = new Date();
        const currentDate = now.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        // Build HTML for PDF (Compact Version)
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>OJT DTR Report</title>
                <style>
                    /* Reset & Base */
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Arial', 'Helvetica', sans-serif;
                        background: #fff;
                        padding: 20px 30px;
                        color: #2c3e50;
                        line-height: 1.4;
                        font-size: 12px;
                    }
                    /* Container */
                    .report {
                        max-width: 1000px;
                        margin: 0 auto;
                        background: #fff;
                        padding: 15px 20px;
                        border: 1px solid #ddd;
                        box-shadow: 0 0 10px rgba(0,0,0,0.03);
                    }
                    /* Header */
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #e67e22;
                        padding-bottom: 10px;
                        margin-bottom: 15px;
                    }
                    .header h1 {
                        font-size: 22px;
                        color: #2c3e50;
                        margin: 0;
                        letter-spacing: 0.5px;
                    }
                    .header .sub {
                        font-size: 13px;
                        color: #7f8c8d;
                        margin-top: 2px;
                    }
                    .header .date-range {
                        font-size: 12px;
                        color: #7f8c8d;
                        margin-top: 2px;
                        font-style: italic;
                    }
                    /* User Info Grid - Compact */
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 4px 15px;
                        background: #fdf6ec;
                        padding: 10px 16px;
                        border-radius: 6px;
                        margin-bottom: 15px;
                        border-left: 3px solid #e67e22;
                        font-size: 11px;
                    }
                    .info-grid .item {
                        display: flex;
                    }
                    .info-grid .label {
                        font-weight: 700;
                        color: #2c3e50;
                        min-width: 80px;
                    }
                    .info-grid .value {
                        color: #34495e;
                    }
                    /* Table - Compact */
                    .table-wrap {
                        overflow-x: auto;
                        margin-bottom: 15px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 11px;
                        border-radius: 4px;
                        overflow: hidden;
                    }
                    table thead {
                        background: #2c3e50;
                        color: #fff;
                    }
                    table th {
                        padding: 6px 8px;
                        text-align: left;
                        font-weight: 600;
                        letter-spacing: 0.3px;
                        font-size: 10px;
                        text-transform: uppercase;
                    }
                    table td {
                        padding: 5px 8px;
                        border-bottom: 1px solid #ecf0f1;
                    }
                    table tbody tr:nth-child(even) {
                        background: #f9f9f9;
                    }
                    table tbody tr:hover {
                        background: #fdf6ec;
                    }
                    table .totals-row {
                        background: #fdf6ec !important;
                        font-weight: 700;
                        border-top: 2px solid #e67e22;
                    }
                    table .totals-row td {
                        padding-top: 8px;
                        padding-bottom: 8px;
                        font-size: 12px;
                    }
                    /* Summary Box - Compact */
                    .summary-box {
                        display: flex;
                        justify-content: space-around;
                        background: #fdf6ec;
                        padding: 10px 16px;
                        border-radius: 6px;
                        margin: 12px 0 20px;
                        border: 1px solid #e8d5c4;
                    }
                    .summary-box .stat {
                        text-align: center;
                    }
                    .summary-box .stat .number {
                        font-size: 18px;
                        font-weight: 700;
                        color: #e67e22;
                    }
                    .summary-box .stat .label {
                        font-size: 10px;
                        color: #7f8c8d;
                        text-transform: uppercase;
                        letter-spacing: 0.3px;
                    }
                    /* Signature Section - Compact */
                    .signature {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 25px;
                        padding-top: 15px;
                        border-top: 2px dashed #bdc3c7;
                    }
                    .signature .block {
                        width: 45%;
                    }
                    .signature .block p {
                        margin: 4px 0;
                        font-size: 11px;
                    }
                    .signature .block .line {
                        margin-top: 20px;
                        border-bottom: 1px solid #2c3e50;
                        width: 80%;
                    }
                    .signature .block .line-label {
                        font-size: 10px;
                        color: #7f8c8d;
                        margin-top: 2px;
                    }
                    /* Footer - Simple with Developer Name */
                    .footer {
                        text-align: center;
                        font-size: 10px;
                        color: #95a5a6;
                        margin-top: 20px;
                        padding-top: 12px;
                        border-top: 1px solid #ecf0f1;
                        line-height: 1.6;
                    }
                    .footer .dev {
                        font-weight: 600;
                        color: #e67e22;
                    }
                    /* Print-specific */
                    @media print {
                        body { padding: 10px; }
                        .report { border: none; box-shadow: none; }
                        table tbody tr:hover { background: #f9f9f9; }
                        .signature { page-break-inside: avoid; }
                        .summary-box { page-break-inside: avoid; }
                    }
                    /* Page break control */
                    .page-break {
                        page-break-after: always;
                    }
                </style>
            </head>
            <body>
                <div class="report">
                    <!-- Header -->
                    <div class="header">
                        <h1>📄 OJT DTR Tracker</h1>
                        <div class="sub">Daily Time Record</div>
                        <div class="date-range">Period: ${dateRange}</div>
                    </div>

                    <!-- User Info -->
                    <div class="info-grid">
                        <div class="item"><span class="label">Intern:</span><span class="value">${fullName}</span></div>
                        <div class="item"><span class="label">Email:</span><span class="value">${user.email || 'N/A'}</span></div>
                        <div class="item"><span class="label">School:</span><span class="value">${user.school || 'N/A'}</span></div>
                        <div class="item"><span class="label">Dept:</span><span class="value">${user.department || 'N/A'}</span></div>
                        <div class="item"><span class="label">Company:</span><span class="value">${user.company || 'N/A'}</span></div>
                        <div class="item"><span class="label">Position:</span><span class="value">${user.position || 'N/A'}</span></div>
                    </div>

                    <!-- Shift Table -->
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th style="width:12%;">Date</th>
                                    <th style="width:30%;">Morning</th>
                                    <th style="width:30%;">Afternoon</th>
                                    <th style="width:18%;">Overtime</th>
                                    <th style="width:10%;text-align:right;">Total</th>
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
                `${formatTime(shift.morning_in)} - ${formatTime(shift.morning_out)} (${mDur.toFixed(1)}h)` :
                '—';
            const afternoonStr = shift.afternoon_in && shift.afternoon_out ?
                `${formatTime(shift.afternoon_in)} - ${formatTime(shift.afternoon_out)} (${aDur.toFixed(1)}h)` :
                '—';
            const otStr = shift.overtime_in && shift.overtime_out ?
                `${formatTime(shift.overtime_in)} - ${formatTime(shift.overtime_out)} (${oDur.toFixed(1)}h)` :
                '—';

            html += `
                <tr>
                    <td>${formatDate(shift.date)}</td>
                    <td>${morningStr}</td>
                    <td>${afternoonStr}</td>
                    <td>${otStr}</td>
                    <td style="text-align:right; font-weight:600;">${total.toFixed(1)}</td>
                </tr>
            `;
        });

        html += `
                            <tr class="totals-row">
                                <td colspan="4" style="text-align:right;">Total Hours</td>
                                <td style="text-align:right; font-size:14px;">${totalHours.toFixed(1)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Summary Box -->
                <div class="summary-box">
                    <div class="stat">
                        <div class="number">${totalHours.toFixed(1)}h</div>
                        <div class="label">Completed</div>
                    </div>
                    <div class="stat">
                        <div class="number">${targetHours}h</div>
                        <div class="label">Target</div>
                    </div>
                    <div class="stat">
                        <div class="number">${remaining.toFixed(1)}h</div>
                        <div class="label">Remaining</div>
                    </div>
                    <div class="stat">
                        <div class="number">${progress.toFixed(1)}%</div>
                        <div class="label">Progress</div>
                    </div>
                </div>

                <!-- Signature Section -->
                <div class="signature">
                    <div class="block">
                        <p><strong>Intern</strong></p>
                        <p>${fullName}</p>
                        <div class="line"></div>
                        <div class="line-label">Signature</div>
                        <div style="margin-top:6px; font-size:10px; color:#7f8c8d;">Date: _______________</div>
                    </div>
                    <div class="block" style="text-align:right;">
                        <p><strong>Supervisor</strong></p>
                        <p>${user.supervisor || 'N/A'}</p>
                        <div class="line" style="margin-left:auto;"></div>
                        <div class="line-label">Signature</div>
                        <div style="margin-top:6px; font-size:10px; color:#7f8c8d;">Date: _______________</div>
                    </div>
                </div>

                <!-- Footer - Simple with Developer Name -->
                <div class="footer">
                    <p>
                        This is an official DTR generated from OJT DTR Tracker (Academic Project)<br>
                        © 2026 OJT DTR Tracker — For Student Use &nbsp;·&nbsp; 
                        <a href="#">Privacy Policy</a> &nbsp;·&nbsp; 
                        <a href="#">Terms of Service</a>
                    </p>
                    <p style="margin-top:4px;">
                        <span class="dev">Developed by John Dexter Obut</span> &nbsp;·&nbsp; 
                        Report generated on ${currentDate}
                    </p>
                </div>
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
