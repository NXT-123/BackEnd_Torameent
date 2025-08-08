const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/jwt');

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

            // Update last login: field not present in schema; skip to keep schema alignment

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
            // In a more sophisticated system, you might want to blacklist the token
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