import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import auctionItemRoutes from "./routes/auctionItem.routes.js";
import bidRoutes from "./routes/bid.routes.js";
import { getServerTime } from "./utils/timeSync.util.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", auctionItemRoutes);
app.use("/api/bids", bidRoutes);

// Server time endpoint for client synchronization
app.get("/api/time", (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            serverTime: getServerTime(),
            timestamp: new Date().toISOString(),
        },
    });
});

// Health check route
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

export { app };