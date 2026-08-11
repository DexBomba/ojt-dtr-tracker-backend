
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

// ===== REGISTER =====
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password' });
        }

        // Check if user exists
        const existingUsers = await query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert user
        const result = await query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        const userId = result.insertId;

        // Generate JWT
        const token = jwt.sign(
            { id: userId, email: email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: userId, name, email }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== LOGIN =====
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user
        const users = await query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                target_hours: user.target_hours
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== GET PROFILE =====
export const getProfile = async (req, res) => {
    try {
        const user = await query(
            'SELECT id, name, email, target_hours, full_name, school, department, company, position, supervisor, supervisor_title FROM users WHERE id = ?',
            [req.user.id]
        );

        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user: user[0] });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== UPDATE PROFILE =====
export const updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const userId = req.user.id;

        if (!name && !email) {
            return res.status(400).json({ message: 'Please provide name or email to update' });
        }

        let updates = [];
        let params = [];

        if (name) {
            updates.push('name = ?');
            params.push(name);
        }

        if (email) {
            // Check if email already exists for another user
            const existing = await query('SELECT * FROM users WHERE email = ? AND id != ?', [email, userId]);
            if (existing.length > 0) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            updates.push('email = ?');
            params.push(email);
        }

        params.push(userId);
        const queryStr = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        await query(queryStr, params);

        res.json({ message: 'Profile updated successfully' });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};