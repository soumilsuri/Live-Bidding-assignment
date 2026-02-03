import Bid from "../models/Bid.models.js";
import AuctionItem from "../models/AuctionItem.models.js";
import { isAuctionEnded } from "../utils/timeSync.util.js";

/**
 * Place a bid on an auction item
 * POST /api/bids
 * @access Protected
 * 
 * RACE CONDITION HANDLING: Uses optimistic locking with version field
 * to ensure only one bid succeeds when multiple bids arrive simultaneously
 */
export const placeBid = async (req, res) => {
    try {
        const { itemId, amount } = req.body;
        const userId = req.userId;

        // Validate input
        if (!itemId || !amount) {
            return res.status(400).json({
                success: false,
                message: "Please provide itemId and bid amount.",
            });
        }

        // Validate amount is positive
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Bid amount must be a positive number.",
            });
        }

        // Find the auction item
        const item = await AuctionItem.findById(itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Auction item not found.",
            });
        }

        // Check if auction has ended
        if (isAuctionEnded(item.auctionEndTime) || item.itemStatus === "ENDED") {
            return res.status(410).json({
                success: false,
                message: "Auction has already ended.",
                code: "AUCTION_ENDED",
            });
        }

        // Check if bid is higher than current bid
        if (amount <= item.currentBid) {
            return res.status(400).json({
                success: false,
                message: `Bid must be higher than current bid of $${item.currentBid}.`,
                currentBid: item.currentBid,
            });
        }

        // Store current version for optimistic locking
        const currentVersion = item.version;

        /**
         * CRITICAL: Race Condition Handling using Optimistic Locking
         * 
         * This atomic operation ensures that:
         * 1. Only ONE bid succeeds if multiple arrive at the same time
         * 2. The version field acts as an optimistic lock
         * 3. If version changed, it means another bid was placed first
         * 4. MongoDB executes this as a single atomic operation
         */
        const updatedItem = await AuctionItem.findOneAndUpdate(
            {
                _id: itemId,
                version: currentVersion, // Optimistic lock - only update if version matches
                currentBid: { $lt: amount }, // Double-check bid is still higher
                auctionEndTime: { $gt: new Date() }, // Double-check auction not ended
                itemStatus: "LIVE", // Ensure auction is still live
            },
            {
                $set: {
                    currentBid: amount,
                    highestBidderId: userId,
                },
                $inc: { version: 1 }, // Increment version to prevent concurrent updates
            },
            {
                new: true, // Return updated document
                runValidators: true,
            }
        );

        // If update failed, it means we lost the race condition
        if (!updatedItem) {
            // Fetch current state to give accurate feedback
            const currentItem = await AuctionItem.findById(itemId);

            if (!currentItem) {
                return res.status(404).json({
                    success: false,
                    message: "Auction item not found.",
                });
            }

            if (
                isAuctionEnded(currentItem.auctionEndTime) ||
                currentItem.itemStatus === "ENDED"
            ) {
                return res.status(410).json({
                    success: false,
                    message: "Auction has ended.",
                    code: "AUCTION_ENDED",
                });
            }

            // User was outbid by someone else (race condition)
            return res.status(409).json({
                success: false,
                message: "You were outbid! Another user placed a higher bid.",
                code: "OUTBID",
                currentBid: currentItem.currentBid,
                yourBid: amount,
            });
        }

        // Create bid record in database
        const bid = await Bid.create({
            itemId,
            userId,
            amount,
        });

        // Populate user details for response
        await bid.populate("userId", "username email");

        res.status(201).json({
            success: true,
            message: "Bid placed successfully!",
            data: {
                bid: {
                    _id: bid._id,
                    itemId: bid.itemId,
                    userId: bid.userId,
                    amount: bid.amount,
                    createdAt: bid.createdAt,
                },
                item: {
                    _id: updatedItem._id,
                    title: updatedItem.title,
                    currentBid: updatedItem.currentBid,
                    highestBidderId: updatedItem.highestBidderId,
                    version: updatedItem.version,
                },
            },
        });
    } catch (error) {
        console.error("Place bid error:", error);

        // Handle invalid ObjectId
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid item ID format.",
            });
        }

        // Handle validation errors
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((err) => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(", "),
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error while placing bid.",
        });
    }
};

/**
 * Get bid history for a specific auction item
 * GET /api/bids/item/:itemId
 * @access Public
 */
export const getItemBids = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Verify item exists
        const itemExists = await AuctionItem.findById(itemId);
        if (!itemExists) {
            return res.status(404).json({
                success: false,
                message: "Auction item not found.",
            });
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get bids for this item
        const bids = await Bid.find({ itemId })
            .populate("userId", "username email")
            .sort({ createdAt: -1 }) // Newest first
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count
        const totalBids = await Bid.countDocuments({ itemId });

        res.status(200).json({
            success: true,
            data: {
                bids,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalBids / parseInt(limit)),
                    totalBids,
                    bidsPerPage: parseInt(limit),
                },
            },
        });
    } catch (error) {
        console.error("Get item bids error:", error);

        // Handle invalid ObjectId
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid item ID format.",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error while fetching bids.",
        });
    }
};

/**
 * Get authenticated user's bid history
 * GET /api/bids/user/me
 * @access Protected
 */
export const getMyBids = async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 20 } = req.query;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get user's bids with item details
        const bids = await Bid.find({ userId })
            .populate("itemId")
            .sort({ createdAt: -1 }) // Newest first
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Enhance each bid with status (winning/outbid)
        const bidsWithStatus = bids.map((bid) => {
            const item = bid.itemId;
            const isWinning =
                item &&
                item.highestBidderId &&
                item.highestBidderId.toString() === userId.toString();
            const isEnded = item && item.itemStatus === "ENDED";

            return {
                ...bid,
                status: isEnded
                    ? item.winnerId && item.winnerId.toString() === userId.toString()
                        ? "WON"
                        : "LOST"
                    : isWinning
                        ? "WINNING"
                        : "OUTBID",
            };
        });

        // Get total count
        const totalBids = await Bid.countDocuments({ userId });

        res.status(200).json({
            success: true,
            data: {
                bids: bidsWithStatus,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalBids / parseInt(limit)),
                    totalBids,
                    bidsPerPage: parseInt(limit),
                },
            },
        });
    } catch (error) {
        console.error("Get my bids error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error while fetching your bids.",
        });
    }
};
