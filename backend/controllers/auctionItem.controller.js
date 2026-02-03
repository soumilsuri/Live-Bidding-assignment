import AuctionItem from "../models/AuctionItem.models.js";
import Bid from "../models/Bid.models.js";
import {
    calculateTimeRemaining,
    isValidAuctionEndTime,
} from "../utils/timeSync.util.js";

/**
 * Get all auction items
 * GET /api/items
 * @query status - Filter by status (LIVE/ENDED)
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 20)
 */
export const getAllItems = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        // Build query
        const query = {};
        if (status && ["LIVE", "ENDED"].includes(status.toUpperCase())) {
            query.itemStatus = status.toUpperCase();
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get items with pagination
        const items = await AuctionItem.find(query)
            .populate("highestBidderId", "username email")
            .populate("winnerId", "username email")
            .sort({ auctionEndTime: 1 }) // Soonest ending first
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count for pagination
        const totalItems = await AuctionItem.countDocuments(query);

        // Add time remaining and bid count to each item
        const itemsWithDetails = await Promise.all(
            items.map(async (item) => {
                const bidCount = await Bid.countDocuments({ itemId: item._id });
                return {
                    ...item,
                    timeRemaining: calculateTimeRemaining(item.auctionEndTime),
                    bidCount,
                };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                items: itemsWithDetails,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalItems / parseInt(limit)),
                    totalItems,
                    itemsPerPage: parseInt(limit),
                },
            },
        });
    } catch (error) {
        console.error("Get all items error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error while fetching items.",
        });
    }
};

/**
 * Get single auction item by ID
 * GET /api/items/:id
 */
export const getItemById = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await AuctionItem.findById(id)
            .populate("highestBidderId", "username email")
            .populate("winnerId", "username email")
            .lean();

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Auction item not found.",
            });
        }

        // Get bid count
        const bidCount = await Bid.countDocuments({ itemId: item._id });

        res.status(200).json({
            success: true,
            data: {
                item: {
                    ...item,
                    timeRemaining: calculateTimeRemaining(item.auctionEndTime),
                    bidCount,
                },
            },
        });
    } catch (error) {
        console.error("Get item by ID error:", error);

        // Handle invalid ObjectId
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid item ID format.",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error while fetching item.",
        });
    }
};

/**
 * Create new auction item
 * POST /api/items
 * @access Protected
 */
export const createItem = async (req, res) => {
    try {
        const { title, startingPrice, auctionEndTime } = req.body;

        // Validate input
        if (!title || !startingPrice || !auctionEndTime) {
            return res.status(400).json({
                success: false,
                message: "Please provide title, startingPrice, and auctionEndTime.",
            });
        }

        // Validate auction end time is in the future
        if (!isValidAuctionEndTime(auctionEndTime)) {
            return res.status(400).json({
                success: false,
                message: "Auction end time must be in the future.",
            });
        }

        // Validate starting price
        if (startingPrice < 0) {
            return res.status(400).json({
                success: false,
                message: "Starting price must be a positive number.",
            });
        }

        // Create auction item
        const item = await AuctionItem.create({
            title,
            startingPrice,
            currentBid: startingPrice,
            auctionEndTime,
            itemStatus: "LIVE",
        });

        res.status(201).json({
            success: true,
            message: "Auction item created successfully.",
            data: {
                item: {
                    ...item.toObject(),
                    timeRemaining: calculateTimeRemaining(item.auctionEndTime),
                    bidCount: 0,
                },
            },
        });
    } catch (error) {
        console.error("Create item error:", error);

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
            message: "Internal server error while creating item.",
        });
    }
};

/**
 * Update auction item
 * PUT /api/items/:id
 * @access Protected
 */
export const updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, startingPrice, auctionEndTime } = req.body;

        // Find item
        const item = await AuctionItem.findById(id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Auction item not found.",
            });
        }

        // Prevent updating ended auctions
        if (item.itemStatus === "ENDED") {
            return res.status(400).json({
                success: false,
                message: "Cannot update ended auction.",
            });
        }

        // Validate auction end time if provided
        if (auctionEndTime && !isValidAuctionEndTime(auctionEndTime)) {
            return res.status(400).json({
                success: false,
                message: "Auction end time must be in the future.",
            });
        }

        // Update fields
        if (title) item.title = title;
        if (startingPrice !== undefined) {
            if (startingPrice < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Starting price must be a positive number.",
                });
            }
            // Only update if no bids have been placed
            if (item.currentBid === item.startingPrice) {
                item.startingPrice = startingPrice;
                item.currentBid = startingPrice;
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Cannot update starting price after bids have been placed.",
                });
            }
        }
        if (auctionEndTime) item.auctionEndTime = auctionEndTime;

        await item.save();

        res.status(200).json({
            success: true,
            message: "Auction item updated successfully.",
            data: {
                item: {
                    ...item.toObject(),
                    timeRemaining: calculateTimeRemaining(item.auctionEndTime),
                },
            },
        });
    } catch (error) {
        console.error("Update item error:", error);

        // Handle invalid ObjectId
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid item ID format.",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error while updating item.",
        });
    }
};

/**
 * Delete auction item
 * DELETE /api/items/:id
 * @access Protected
 */
export const deleteItem = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await AuctionItem.findById(id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Auction item not found.",
            });
        }

        // Delete associated bids
        await Bid.deleteMany({ itemId: id });

        // Delete item
        await AuctionItem.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Auction item deleted successfully.",
        });
    } catch (error) {
        console.error("Delete item error:", error);

        // Handle invalid ObjectId
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid item ID format.",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error while deleting item.",
        });
    }
};
