import express from "express";
import {
    getAllItems,
    getItemById,
    createItem,
    updateItem,
    deleteItem,
} from "../controllers/auctionItem.controller.js";
import { authenticate, optionalAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @route   GET /api/items
 * @desc    Get all auction items
 * @access  Public
 * @query   status - Filter by LIVE/ENDED
 * @query   page - Page number
 * @query   limit - Items per page
 */
router.get("/", getAllItems);

/**
 * @route   GET /api/items/:id
 * @desc    Get single auction item by ID
 * @access  Public
 */
router.get("/:id", getItemById);

/**
 * @route   POST /api/items
 * @desc    Create new auction item
 * @access  Private (requires authentication)
 */
router.post("/", authenticate, createItem);

/**
 * @route   PUT /api/items/:id
 * @desc    Update auction item
 * @access  Private (requires authentication)
 */
router.put("/:id", authenticate, updateItem);

/**
 * @route   DELETE /api/items/:id
 * @desc    Delete auction item
 * @access  Private (requires authentication)
 */
router.delete("/:id", authenticate, deleteItem);

export default router;
