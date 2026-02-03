import jwt from "jsonwebtoken";

/**
 * Generate JWT token for a user
 * @param {Object} payload - User data to encode in token (typically userId)
 * @param {String} expiresIn - Token expiration time (default: 7 days)
 * @returns {String} JWT token
 */
export const generateToken = (payload, expiresIn = "7d") => {
    try {
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn,
        });
        return token;
    } catch (error) {
        throw new Error("Error generating token: " + error.message);
    }
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new Error("Token has expired");
        } else if (error.name === "JsonWebTokenError") {
            throw new Error("Invalid token");
        } else {
            throw new Error("Token verification failed: " + error.message);
        }
    }
};
