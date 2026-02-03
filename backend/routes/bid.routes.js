import express from "express";
import {
    placeBid,
    getItemBids,
    getMyBids,
} from "../controllers/bid.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @route   POST /api/bids
 * @desc    Place a bid on an auction item
 * @access  Private (requires authentication)
 */
router.post("/", authenticate, placeBid);

/**
 * @route   GET /api/bids/item/:itemId
 * @desc    Get bid history for a specific item
 * @access  Public
 * @query   page - Page number
 * @query   limit - Bids per page
 */
router.get("/item/:itemId", getItemBids);

/**
 * @route   GET /api/bids/user/me
 * @desc    Get authenticated user's bid history
 * @access  Private (requires authentication)
 * @query   page - Page number
 * @query   limit - Bids per page
 */
router.get("/user/me", authenticate, getMyBids);

export default router;
