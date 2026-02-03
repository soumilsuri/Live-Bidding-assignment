import { verifyToken } from "../utils/jwt.util.js";
import User from "../models/User.models.js";

/**
 * Middleware to authenticate user via JWT token
 * Expects token in Authorization header as "Bearer <token>"
 */
export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided or invalid format.",
            });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Token is missing.",
            });
        }

        // Verify token
        const decoded = verifyToken(token);

        // Find user by ID from token
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid token. User not found.",
            });
        }

        // Attach user to request object
        req.user = user;
        req.userId = user._id;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message || "Authentication failed.",
        });
    }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't block if invalid
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];

            if (token) {
                try {
                    const decoded = verifyToken(token);
                    const user = await User.findById(decoded.userId).select("-password");

                    if (user) {
                        req.user = user;
                        req.userId = user._id;
                    }
                } catch (error) {
                    // Silently fail for optional auth
                    console.log("Optional auth failed:", error.message);
                }
            }
        }

        next();
    } catch (error) {
        // Continue even if there's an error
        next();
    }
};
