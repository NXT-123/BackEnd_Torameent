const User = require('../models/User');

class UserController {
    static getAllUsers(req, res) {
        res.json({
            success: true,
            message: "All users retrieved successfully",
            data: {
                users: [
                    {
                        _id: "507f1f77bcf86cd799439011",
                        email: "testuser@esport.com",
                        fullName: "Test User",
                        role: "user",
                        isActive: true,
                        createdAt: "2024-01-15T10:00:00.000Z"
                    },
                    {
                        _id: "507f1f77bcf86cd799439012",
                        email: "admin@esport.com",
                        fullName: "Admin User",
                        role: "admin",
                        isActive: true,
                        createdAt: "2024-01-01T10:00:00.000Z"
                    },
                    {
                        _id: "507f1f77bcf86cd799439013",
                        email: "organizer@esport.com",
                        fullName: "Organizer User",
                        role: "organizer",
                        isActive: true,
                        createdAt: "2024-01-10T10:00:00.000Z"
                    }
                ],
                total: 3,
                page: 1,
                limit: 10
            }
        });
    }

    static getUserById(req, res) {
        const { id } = req.params;
        
        res.json({
            success: true,
            message: "User retrieved successfully",
            data: {
                _id: id,
                email: "testuser@esport.com",
                fullName: "Test User",
                role: "user",
                isActive: true,
                createdAt: "2024-01-15T10:00:00.000Z",
                lastLogin: "2024-12-20T10:00:00.000Z",
                tournaments: [],
                matches: []
            }
        });
    }

    static getUsersByRole(req, res) {
        const { role } = req.params;
        
        res.json({
            success: true,
            message: `Users with role '${role}' retrieved successfully`,
            data: {
                users: [
                    {
                        _id: "507f1f77bcf86cd799439011",
                        email: "testuser@esport.com",
                        fullName: "Test User",
                        role: role,
                        isActive: true,
                        createdAt: "2024-01-15T10:00:00.000Z"
                    }
                ],
                total: 1,
                role: role
            }
        });
    }

    static searchUsers(req, res) {
        const { q } = req.query;
        
        res.json({
            success: true,
            message: `Search results for '${q}'`,
            data: {
                users: [
                    {
                        _id: "507f1f77bcf86cd799439011",
                        email: "testuser@esport.com",
                        fullName: "Test User",
                        role: "user",
                        isActive: true,
                        createdAt: "2024-01-15T10:00:00.000Z"
                    }
                ],
                total: 1,
                query: q
            }
        });
    }

    static getUserStats(req, res) {
        res.json({
            success: true,
            message: "User statistics retrieved successfully",
            data: {
                total_users: 150,
                active_users: 130,
                inactive_users: 20,
                roles: {
                    admin: 2,
                    organizer: 8,
                    user: 140
                },
                registrations: {
                    today: 5,
                    this_week: 28,
                    this_month: 120
                },
                growth_rate: 15.5
            }
        });
    }

    static getUserActivity(req, res) {
        res.json({
            success: true,
            message: "User activity retrieved successfully",
            data: {
                recent_activities: [
                    {
                        user_id: "507f1f77bcf86cd799439011",
                        user_name: "Test User",
                        action: "tournament_registration",
                        details: "Registered for Valorant Championship",
                        timestamp: new Date().toISOString()
                    },
                    {
                        user_id: "507f1f77bcf86cd799439012",
                        user_name: "Admin User",
                        action: "news_created",
                        details: "Created new news article",
                        timestamp: new Date(Date.now() - 3600000).toISOString()
                    }
                ],
                total_activities: 2
            }
        });
    }

    static updateUserRole(req, res) {
        const { id } = req.params;
        const { role } = req.body;
        
        res.json({
            success: true,
            message: "User role updated successfully",
            data: {
                _id: id,
                old_role: "user",
                new_role: role,
                updated_at: new Date().toISOString()
            }
        });
    }

    static deactivateUser(req, res) {
        const { id } = req.params;
        
        res.json({
            success: true,
            message: "User deactivated successfully",
            data: {
                _id: id,
                isActive: false,
                deactivated_at: new Date().toISOString()
            }
        });
    }

    static reactivateUser(req, res) {
        const { id } = req.params;
        
        res.json({
            success: true,
            message: "User reactivated successfully",
            data: {
                _id: id,
                isActive: true,
                reactivated_at: new Date().toISOString()
            }
        });
    }
}

module.exports = UserController;