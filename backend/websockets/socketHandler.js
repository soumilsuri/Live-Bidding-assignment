import { verifyToken } from "../utils/jwt.util.js";
import User from "../models/User.models.js";
import AuctionItem from "../models/AuctionItem.models.js";
import Bid from "../models/Bid.models.js";
import { isAuctionEnded, getServerTime } from "../utils/timeSync.util.js";

/**
 * Initialize WebSocket handlers
 * @param {Server} io - Socket.io server instance
 */
const initializeSocketHandlers = (io) => {
    // Middleware to authenticate socket connections
    io.use(async (socket, next) => {
        try {
            // Extract token from handshake auth or query
            const token =
                socket.handshake.auth.token || socket.handshake.query.token;

            if (!token) {
                return next(new Error("Authentication error: No token provided"));
            }

            // Verify token
            const decoded = verifyToken(token);

            // Find user
            const user = await User.findById(decoded.userId).select("-password");

            if (!user) {
                return next(new Error("Authentication error: User not found"));
            }

            // Attach user to socket
            socket.userId = user._id.toString();
            socket.username = user.username;

            next();
        } catch (error) {
            console.error("Socket authentication error:", error.message);
            next(new Error("Authentication error: " + error.message));
        }
    });

    // Handle client connections
    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.username} (${socket.userId})`);

        /**
         * JOIN_AUCTION - User joins a specific auction room
         * Client sends: { itemId }
         */
        socket.on("JOIN_AUCTION", async ({ itemId }) => {
            try {
                // Validate item exists
                const item = await AuctionItem.findById(itemId)
                    .populate("highestBidderId", "username")
                    .lean();

                if (!item) {
                    socket.emit("ERROR", {
                        message: "Auction item not found",
                        event: "JOIN_AUCTION",
                    });
                    return;
                }

                // Join room for this auction
                socket.join(`auction:${itemId}`);

                console.log(
                    `User ${socket.username} joined auction room: ${itemId}`
                );

                // Send current auction state to the user
                socket.emit("AUCTION_STATE", {
                    itemId: item._id,
                    title: item.title,
                    currentBid: item.currentBid,
                    highestBidderId: item.highestBidderId?._id,
                    highestBidderUsername: item.highestBidderId?.username,
                    auctionEndTime: item.auctionEndTime,
                    itemStatus: item.itemStatus,
                    version: item.version,
                });
            } catch (error) {
                console.error("JOIN_AUCTION error:", error);
                socket.emit("ERROR", {
                    message: "Failed to join auction",
                    event: "JOIN_AUCTION",
                });
            }
        });

        /**
         * LEAVE_AUCTION - User leaves a specific auction room
         * Client sends: { itemId }
         */
        socket.on("LEAVE_AUCTION", ({ itemId }) => {
            try {
                socket.leave(`auction:${itemId}`);
                console.log(
                    `User ${socket.username} left auction room: ${itemId}`
                );
            } catch (error) {
                console.error("LEAVE_AUCTION error:", error);
            }
        });

        /**
         * BID_PLACED - User places a bid via WebSocket
         * Client sends: { itemId, amount }
         * 
         * This handles the same logic as REST API but with real-time broadcast
         */
        socket.on("BID_PLACED", async ({ itemId, amount }) => {
            try {
                const userId = socket.userId;

                // Validate input
                if (!itemId || !amount) {
                    socket.emit("OUTBID_ERROR", {
                        message: "Please provide itemId and bid amount",
                        code: "INVALID_INPUT",
                    });
                    return;
                }

                // Validate amount
                if (amount <= 0) {
                    socket.emit("OUTBID_ERROR", {
                        message: "Bid amount must be a positive number",
                        code: "INVALID_AMOUNT",
                    });
                    return;
                }

                // Find the auction item
                const item = await AuctionItem.findById(itemId);

                if (!item) {
                    socket.emit("OUTBID_ERROR", {
                        message: "Auction item not found",
                        code: "ITEM_NOT_FOUND",
                    });
                    return;
                }

                // Check if auction has ended
                if (isAuctionEnded(item.auctionEndTime) || item.itemStatus === "ENDED") {
                    socket.emit("OUTBID_ERROR", {
                        message: "Auction has already ended",
                        code: "AUCTION_ENDED",
                    });
                    return;
                }

                // Check if bid is higher than current bid
                if (amount <= item.currentBid) {
                    socket.emit("OUTBID_ERROR", {
                        message: `Bid must be higher than current bid of $${item.currentBid}`,
                        currentBid: item.currentBid,
                        yourBid: amount,
                        code: "BID_TOO_LOW",
                    });
                    return;
                }

                // Store current version for optimistic locking
                const currentVersion = item.version;

                /**
                 * CRITICAL: Race Condition Handling using Optimistic Locking
                 * Same atomic operation as REST API
                 */
                const updatedItem = await AuctionItem.findOneAndUpdate(
                    {
                        _id: itemId,
                        version: currentVersion,
                        currentBid: { $lt: amount },
                        auctionEndTime: { $gt: new Date() },
                        itemStatus: "LIVE",
                    },
                    {
                        $set: {
                            currentBid: amount,
                            highestBidderId: userId,
                        },
                        $inc: { version: 1 },
                    },
                    {
                        new: true,
                        runValidators: true,
                    }
                ).populate("highestBidderId", "username");

                // If update failed, user lost the race condition
                if (!updatedItem) {
                    const currentItem = await AuctionItem.findById(itemId);

                    if (!currentItem) {
                        socket.emit("OUTBID_ERROR", {
                            message: "Auction item not found",
                            code: "ITEM_NOT_FOUND",
                        });
                        return;
                    }

                    if (
                        isAuctionEnded(currentItem.auctionEndTime) ||
                        currentItem.itemStatus === "ENDED"
                    ) {
                        socket.emit("OUTBID_ERROR", {
                            message: "Auction has ended",
                            code: "AUCTION_ENDED",
                        });
                        return;
                    }

                    // User was outbid
                    socket.emit("OUTBID_ERROR", {
                        message: "You were outbid! Another user placed a higher bid.",
                        code: "OUTBID",
                        currentBid: currentItem.currentBid,
                        yourBid: amount,
                    });
                    return;
                }

                // Create bid record
                const bid = await Bid.create({
                    itemId,
                    userId,
                    amount,
                });

                // Broadcast UPDATE_BID to all users in this auction room
                io.to(`auction:${itemId}`).emit("UPDATE_BID", {
                    itemId: updatedItem._id,
                    currentBid: updatedItem.currentBid,
                    highestBidderId: updatedItem.highestBidderId._id,
                    highestBidderUsername: updatedItem.highestBidderId.username,
                    version: updatedItem.version,
                    timestamp: new Date().toISOString(),
                });

                console.log(
                    `Bid placed: ${socket.username} bid $${amount} on ${itemId}`
                );
            } catch (error) {
                console.error("BID_PLACED error:", error);
                socket.emit("OUTBID_ERROR", {
                    message: "Failed to place bid. Please try again.",
                    code: "SERVER_ERROR",
                });
            }
        });

        /**
         * REQUEST_TIME_SYNC - Client requests server time
         */
        socket.on("REQUEST_TIME_SYNC", () => {
            socket.emit("TIME_SYNC", {
                serverTime: getServerTime(),
            });
        });

        /**
         * Handle disconnection
         */
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.username} (${socket.userId})`);
        });
    });

    // Periodic time sync broadcast (every 30 seconds)
    setInterval(() => {
        io.emit("TIME_SYNC", {
            serverTime: getServerTime(),
        });
    }, 30000);

    console.log("WebSocket handlers initialized");
};

export default initializeSocketHandlers;
