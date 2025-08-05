const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        config.jwtSecret,
        { expiresIn: config.jwtExpire }
    );
};

// Generate refresh token (longer expiry)
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId, type: 'refresh' },
        config.jwtSecret,
        { expiresIn: '30d' }
    );
};

// Verify token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

// Generate password reset token
const generatePasswordResetToken = (userId) => {
    return jwt.sign(
        { id: userId, type: 'password-reset' },
        config.jwtSecret,
        { expiresIn: '1h' }
    );
};

// Generate email verification token
const generateEmailVerificationToken = (userId, email) => {
    return jwt.sign(
        { id: userId, email, type: 'email-verification' },
        config.jwtSecret,
        { expiresIn: '24h' }
    );
};

// Extract user ID from token
const getUserIdFromToken = (token) => {
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        return decoded.id;
    } catch (error) {
        return null;
    }
};

// Check if token is expired
const isTokenExpired = (token) => {
    try {
        jwt.verify(token, config.jwtSecret);
        return false;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return true;
        }
        return true; // Invalid token is considered expired
    }
};

// Get token expiry date
const getTokenExpiry = (token) => {
    try {
        const decoded = jwt.decode(token);
        return new Date(decoded.exp * 1000);
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateToken,
    generateRefreshToken,
    verifyToken,
    generatePasswordResetToken,
    generateEmailVerificationToken,
    getUserIdFromToken,
    isTokenExpired,
    getTokenExpiry
};