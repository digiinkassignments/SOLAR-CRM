const jwt = require("jsonwebtoken");

// ========================================
// Verify JWT Token
// ========================================
const verifyToken = (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        // Token Missing
        if (!authHeader || !authHeader.startsWith("Bearer ")) {

            return res.status(401).json({
                success: false,
                message: "Access denied. Token not provided."
            });

        }

        // Get Token
        const token = authHeader.split(" ")[1];

        // Verify Token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Save User Data
        req.user = decoded;
        if (!req.user.client_id && req.clientInfo?.id) {
            req.user.client_id = req.clientInfo.id;
        }

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });

    }

};

module.exports = {
    verifyToken,
    authMiddleware: verifyToken
};