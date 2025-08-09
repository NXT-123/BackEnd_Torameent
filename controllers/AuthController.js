const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

class AuthController {
    // Register new user
    static async register(req, res) {
        try {
            const { email, fullName, password, role = 'user' } = req.body;

            // Validate required fields
            if (!email || !fullName || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email, full name, and password are required'
                });
            }

            // In mock mode, return a fake user and tokens without DB
            if (global.mockMode) {
                const fakeUser = {
                    _id: '000000000000000000000001',
                    email,
                    fullName,
                    role
                };
                const token = jwt.sign({ id: fakeUser._id, role: fakeUser.role, email: fakeUser.email }, config.jwtSecret, { expiresIn: config.jwtExpire });
                const refreshToken = jwt.sign({ id: fakeUser._id, type: 'refresh' }, config.jwtSecret, { expiresIn: '30d' });
                return res.status(201).json({
                    success: true,
                    message: 'User registered successfully',
                    data: { user: fakeUser, token, refreshToken }
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            // Create new user (store hashed password to passwordHash)
            const passwordHash = await bcrypt.hash(password, 10);
            const user = new User({
                email,
                fullName,
                passwordHash,
                role
            });

            await user.save();

            // Generate tokens
            const token = generateToken(user._id);
            const refreshToken = generateRefreshToken(user._id);

            // Remove password from response
            const userResponse = user.toObject();
            delete userResponse.passwordHash;

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: userResponse,
                    token,
                    refreshToken
                }
            });
        } catch (error) {
            console.error('Registration error:', error);

            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error during registration'
            });
        }
    }

    // Login user
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validate required fields
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Mock mode: accept known test accounts
            if (global.mockMode) {
                const accounts = {
                    'admin@esport.com': { role: 'admin', password: 'admin123', id: '00000000000000000000a001' },
                    'organizer@esport.com': { role: 'organizer', password: 'organizer123', id: '00000000000000000000o001' },
                    'testuser@esport.com': { role: 'user', password: 'password123', id: '00000000000000000000u001' }
                };
                const acct = accounts[email];
                if (!acct || acct.password !== password) {
                    return res.status(401).json({ success: false, message: 'Invalid credentials' });
                }
                const token = jwt.sign({ id: acct.id, role: acct.role, email }, config.jwtSecret, { expiresIn: config.jwtExpire });
                const refreshToken = jwt.sign({ id: acct.id, type: 'refresh' }, config.jwtSecret, { expiresIn: '30d' });
                return res.json({
                    success: true,
                    message: 'Login successful',
                    data: { user: { _id: acct.id, email, role: acct.role }, token, refreshToken }
                });
            }

            // Find user and include passwordHash for comparison
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Verify password using bcrypt against passwordHash
            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Generate tokens
            const token = generateToken(user._id);
            const refreshToken = generateRefreshToken(user._id);

            // Remove password from response
            const userResponse = user.toObject();
            delete userResponse.passwordHash;

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: userResponse,
                    token,
                    refreshToken
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during login'
            });
        }
    }

    // Get current user profile
    static async getProfile(req, res) {
        try {
            const user = await User.findById(req.user._id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: { user }
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching profile'
            });
        }
    }

    // Update user profile
    static async updateProfile(req, res) {
        try {
            const { fullName, avatarUrl } = req.body;
            const updateData = {};

            if (fullName) updateData.fullName = fullName;
            if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

            const user = await User.findByIdAndUpdate(
                req.user._id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: { user }
            });
        } catch (error) {
            console.error('Update profile error:', error);

            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error while updating profile'
            });
        }
    }

    // Change password
    static async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required'
                });
            }

            // Get user with password
            const user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Update password
            user.passwordHash = await bcrypt.hash(newPassword, 10);
            await user.save();

            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while changing password'
            });
        }
    }

    // Logout (in a stateless JWT system, this is mainly for client-side)
    static async logout(req, res) {
        try {
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during logout'
            });
        }
    }
}

module.exports = AuthController;