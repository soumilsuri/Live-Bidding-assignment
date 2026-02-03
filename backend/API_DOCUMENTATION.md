# Live Bidding Platform - API Documentation

## 📋 Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Error Codes](#error-codes)
- [REST API Endpoints](#rest-api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [Auction Items](#auction-items-endpoints)
  - [Bidding](#bidding-endpoints)
  - [Server Time](#server-time-endpoint)
- [WebSocket API](#websocket-api)
  - [Connection](#websocket-connection)
  - [Client Events](#client-events)
  - [Server Events](#server-events)
- [Race Condition Handling](#race-condition-handling)

---

## Overview

This API powers a real-time auction platform with REST endpoints and WebSocket communication for live bidding

. Features include:

- JWT-based authentication
- Real-time bid updates via WebSocket
- Production-grade race condition handling using optimistic locking
- Server-side time synchronization

---

## Base URL

```
http://localhost:8000
```

For production, replace with your deployed URL.

---

## Authentication

Most endpoints require authentication via JWT token.

### How to Authenticate

1. **Signup or Login** to get a JWT token
2. **Include token** in the `Authorization` header for protected routes:

```
Authorization: Bearer <your-jwt-token>
```

### Protected Endpoints

Endpoints marked with 🔒 require authentication.

---

## Error Codes

All responses follow this structure:

**Success Response:**

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

**Error Response:**

```json
{
	"success": false,
	"message": "Error message",
	"code": "ERROR_CODE" // Optional
}
```

**Common HTTP Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `409` - Conflict (race condition, user outbid)
- `410` - Gone (auction ended)
- `500` - Internal Server Error

---

## REST API Endpoints

### Authentication Endpoints

#### 1. Signup

**POST** `/api/auth/signup`

Register a new user account.

**Request Body:**

```json
{
	"username": "john_doe",
	"email": "john@example.com",
	"password": "securepassword123"
}
```

**Success Response (201):**

```json
{
	"success": true,
	"message": "User registered successfully.",
	"data": {
		"user": {
			"_id": "60d5f4849f1b2c001f8e4b4a",
			"username": "john_doe",
			"email": "john@example.com",
			"createdAt": "2026-02-02T10:30:00.000Z"
		},
		"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
	}
}
```

**Error Response (409):**

```json
{
	"success": false,
	"message": "User with this email already exists."
}
```

---

#### 2. Login

**POST** `/api/auth/login`

Login to existing account.

**Request Body:**

```json
{
	"email": "john@example.com",
	"password": "securepassword123"
}
```

**Success Response (200):**

```json
{
	"success": true,
	"message": "Login successful.",
	"data": {
		"user": {
			"_id": "60d5f4849f1b2c001f8e4b4a",
			"username": "john_doe",
			"email": "john@example.com",
			"createdAt": "2026-02-02T10:30:00.000Z"
		},
		"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
	}
}
```

**Error Response (401):**

```json
{
	"success": false,
	"message": "Invalid email or password."
}
```

---

#### 3. Get Current User Profile 🔒

**GET** `/api/auth/me`

Get authenticated user's profile.

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
	"success": true,
	"data": {
		"user": {
			"_id": "60d5f4849f1b2c001f8e4b4a",
			"username": "john_doe",
			"email": "john@example.com",
			"createdAt": "2026-02-02T10:30:00.000Z",
			"updatedAt": "2026-02-02T15:45:00.000Z"
		}
	}
}
```

---

#### 4. Logout 🔒

**POST** `/api/auth/logout`

Logout user (client should remove token).

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
	"success": true,
	"message": "Logout successful. Please remove the token from client."
}
```

---

### Auction Items Endpoints

#### 1. Get All Auction Items

**GET** `/api/items`

Get all auction items with optional filtering and pagination.

**Query Parameters:**

- `status` (optional): Filter by status (`LIVE` or `ENDED`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Example Request:**

```
GET /api/items?status=LIVE&page=1&limit=10
```

**Success Response (200):**

```json
{
	"success": true,
	"data": {
		"items": [
			{
				"_id": "60d5f5849f1b2c001f8e4b50",
				"title": "Vintage Watch",
				"startingPrice": 100,
				"currentBid": 250,
				"highestBidderId": {
					"_id": "60d5f4849f1b2c001f8e4b4a",
					"username": "john_doe",
					"email": "john@example.com"
				},
				"auctionEndTime": "2026-02-03T20:00:00.000Z",
				"itemStatus": "LIVE",
				"winnerId": null,
				"finalPrice": null,
				"version": 5,
				"createdAt": "2026-02-02T10:00:00.000Z",
				"updatedAt": "2026-02-02T15:30:00.000Z",
				"timeRemaining": 102600,
				"bidCount": 12
			}
		],
		"pagination": {
			"currentPage": 1,
			"totalPages": 3,
			"totalItems": 25,
			"itemsPerPage": 10
		}
	}
}
```

---

#### 2. Get Single Auction Item

**GET** `/api/items/:id`

Get details of a specific auction item.

**Example Request:**

```
GET /api/items/60d5f5849f1b2c001f8e4b50
```

**Success Response (200):**

```json
{
	"success": true,
	"data": {
		"item": {
			"_id": "60d5f5849f1b2c001f8e4b50",
			"title": "Vintage Watch",
			"startingPrice": 100,
			"currentBid": 250,
			"highestBidderId": {
				"_id": "60d5f4849f1b2c001f8e4b4a",
				"username": "john_doe",
				"email": "john@example.com"
			},
			"auctionEndTime": "2026-02-03T20:00:00.000Z",
			"itemStatus": "LIVE",
			"version": 5,
			"timeRemaining": 102600,
			"bidCount": 12
		}
	}
}
```

**Error Response (404):**

```json
{
	"success": false,
	"message": "Auction item not found."
}
```

---

#### 3. Create Auction Item 🔒

**POST** `/api/items`

Create a new auction item.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
	"title": "Vintage Watch",
	"startingPrice": 100,
	"auctionEndTime": "2026-02-03T20:00:00.000Z"
}
```

**Success Response (201):**

```json
{
	"success": true,
	"message": "Auction item created successfully.",
	"data": {
		"item": {
			"_id": "60d5f5849f1b2c001f8e4b50",
			"title": "Vintage Watch",
			"startingPrice": 100,
			"currentBid": 100,
			"auctionEndTime": "2026-02-03T20:00:00.000Z",
			"itemStatus": "LIVE",
			"version": 0,
			"timeRemaining": 108000,
			"bidCount": 0
		}
	}
}
```

**Error Response (400):**

```json
{
	"success": false,
	"message": "Auction end time must be in the future."
}
```

---

#### 4. Update Auction Item 🔒

**PUT** `/api/items/:id`

Update an existing auction item.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
	"title": "Vintage Luxury Watch",
	"auctionEndTime": "2026-02-04T20:00:00.000Z"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Auction item updated successfully.",
  "data": {
    "item": { ... }
  }
}
```

**Error Response (400):**

```json
{
	"success": false,
	"message": "Cannot update ended auction."
}
```

---

#### 5. Delete Auction Item 🔒

**DELETE** `/api/items/:id`

Delete an auction item and all associated bids.

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
	"success": true,
	"message": "Auction item deleted successfully."
}
```

---

### Bidding Endpoints

#### 1. Place a Bid 🔒

**POST** `/api/bids`

Place a bid on an auction item.

> **Note:** This endpoint handles race conditions using optimistic locking. If multiple users bid simultaneously, only the first bid succeeds.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
	"itemId": "60d5f5849f1b2c001f8e4b50",
	"amount": 260
}
```

**Success Response (201):**

```json
{
	"success": true,
	"message": "Bid placed successfully!",
	"data": {
		"bid": {
			"_id": "60d5f6849f1b2c001f8e4b60",
			"itemId": "60d5f5849f1b2c001f8e4b50",
			"userId": {
				"_id": "60d5f4849f1b2c001f8e4b4a",
				"username": "john_doe",
				"email": "john@example.com"
			},
			"amount": 260,
			"createdAt": "2026-02-02T16:00:00.000Z"
		},
		"item": {
			"_id": "60d5f5849f1b2c001f8e4b50",
			"title": "Vintage Watch",
			"currentBid": 260,
			"highestBidderId": "60d5f4849f1b2c001f8e4b4a",
			"version": 6
		}
	}
}
```

**Error Response - Outbid (409):**

```json
{
	"success": false,
	"message": "You were outbid! Another user placed a higher bid.",
	"code": "OUTBID",
	"currentBid": 280,
	"yourBid": 260
}
```

**Error Response - Auction Ended (410):**

```json
{
	"success": false,
	"message": "Auction has already ended.",
	"code": "AUCTION_ENDED"
}
```

**Error Response - Bid Too Low (400):**

```json
{
	"success": false,
	"message": "Bid must be higher than current bid of $250.",
	"currentBid": 250
}
```

---

#### 2. Get Bid History for Item

**GET** `/api/bids/item/:itemId`

Get all bids for a specific auction item.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Bids per page (default: 50)

**Example Request:**

```
GET /api/bids/item/60d5f5849f1b2c001f8e4b50?page=1&limit=20
```

**Success Response (200):**

```json
{
	"success": true,
	"data": {
		"bids": [
			{
				"_id": "60d5f6849f1b2c001f8e4b60",
				"itemId": "60d5f5849f1b2c001f8e4b50",
				"userId": {
					"_id": "60d5f4849f1b2c001f8e4b4a",
					"username": "john_doe",
					"email": "john@example.com"
				},
				"amount": 260,
				"createdAt": "2026-02-02T16:00:00.000Z"
			}
		],
		"pagination": {
			"currentPage": 1,
			"totalPages": 2,
			"totalBids": 35,
			"bidsPerPage": 20
		}
	}
}
```

---

#### 3. Get My Bid History 🔒

**GET** `/api/bids/user/me`

Get authenticated user's bid history with status.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Bids per page (default: 20)

**Success Response (200):**

```json
{
	"success": true,
	"data": {
		"bids": [
			{
				"_id": "60d5f6849f1b2c001f8e4b60",
				"itemId": {
					"_id": "60d5f5849f1b2c001f8e4b50",
					"title": "Vintage Watch",
					"currentBid": 280,
					"highestBidderId": "60d5f7849f1b2c001f8e4b70",
					"itemStatus": "LIVE"
				},
				"userId": "60d5f4849f1b2c001f8e4b4a",
				"amount": 260,
				"createdAt": "2026-02-02T16:00:00.000Z",
				"status": "OUTBID"
			}
		],
		"pagination": {
			"currentPage": 1,
			"totalPages": 1,
			"totalBids": 5,
			"bidsPerPage": 20
		}
	}
}
```

**Bid Status Values:**

- `WINNING` - User is currently the highest bidder (auction still live)
- `OUTBID` - User was outbid by someone else (auction still live)
- `WON` - User won the auction
- `LOST` - User lost the auction

---

### Server Time Endpoint

#### Get Server Time

**GET** `/api/time`

Get current server timestamp for synchronizing countdown timers.

**Success Response (200):**

```json
{
	"success": true,
	"data": {
		"serverTime": 1738509000000,
		"timestamp": "2026-02-02T16:30:00.000Z"
	}
}
```

**Usage:** Use this to calculate time remaining client-side:

```javascript
const timeRemaining = (auctionEndTime - serverTime) / 1000; // seconds
```

---

## WebSocket API

### WebSocket Connection

Connect to the WebSocket server for real-time updates.

**Connection URL:**

```
ws://localhost:8000
```

**Socket.io Client Example:**

```javascript
import io from "socket.io-client";

const socket = io("http://localhost:8000", {
	auth: {
		token: "your-jwt-token", // Required for authentication
	},
});
```

**Authentication:**

- JWT token must be provided in `auth.token` or `query.token`
- Connection will be rejected if token is invalid

---

### Client Events

Events that the client sends to the server.

#### 1. JOIN_AUCTION

Join a specific auction room to receive real-time updates.

**Emit:**

```javascript
socket.emit("JOIN_AUCTION", {
	itemId: "60d5f5849f1b2c001f8e4b50",
});
```

**Server Response:**
The server will emit an `AUCTION_STATE` event with current auction data.

---

#### 2. LEAVE_AUCTION

Leave a specific auction room (stop receiving updates).

**Emit:**

```javascript
socket.emit("LEAVE_AUCTION", {
	itemId: "60d5f5849f1b2c001f8e4b50",
});
```

---

#### 3. BID_PLACED

Place a bid via WebSocket (alternative to REST API).

**Emit:**

```javascript
socket.emit("BID_PLACED", {
	itemId: "60d5f5849f1b2c001f8e4b50",
	amount: 260,
});
```

**Server Response:**

- Success: `UPDATE_BID` event broadcasted to all users in the room
- Failure: `OUTBID_ERROR` event sent to the bidder

---

#### 4. REQUEST_TIME_SYNC

Request current server time.

**Emit:**

```javascript
socket.emit("REQUEST_TIME_SYNC");
```

**Server Response:**
The server will emit a `TIME_SYNC` event.

---

### Server Events

Events that the server sends to clients.

#### 1. AUCTION_STATE

Sent when a user joins an auction room.

**Listen:**

```javascript
socket.on("AUCTION_STATE", (data) => {
	console.log("Current auction state:", data);
});
```

**Data:**

```json
{
	"itemId": "60d5f5849f1b2c001f8e4b50",
	"title": "Vintage Watch",
	"currentBid": 260,
	"highestBidderId": "60d5f4849f1b2c001f8e4b4a",
	"highestBidderUsername": "john_doe",
	"auctionEndTime": "2026-02-03T20:00:00.000Z",
	"itemStatus": "LIVE",
	"version": 6
}
```

---

#### 2. UPDATE_BID

Broadcasted to all users in an auction room when a new bid is placed.

**Listen:**

```javascript
socket.on("UPDATE_BID", (data) => {
	console.log("New bid placed:", data);
	// Update UI: animate price, show "Winning" or "Outbid" badge
});
```

**Data:**

```json
{
	"itemId": "60d5f5849f1b2c001f8e4b50",
	"currentBid": 280,
	"highestBidderId": "60d5f7849f1b2c001f8e4b70",
	"highestBidderUsername": "jane_smith",
	"version": 7,
	"timestamp": "2026-02-02T16:35:00.000Z"
}
```

**Frontend Logic:**

```javascript
socket.on("UPDATE_BID", (data) => {
	// Update price
	updatePrice(data.currentBid);

	// Animate price (green flash)
	animatePriceUpdate();

	// Check if I'm winning
	if (data.highestBidderId === currentUserId) {
		showWinningBadge();
	} else {
		showOutbidBadge();
	}
});
```

---

#### 3. OUTBID_ERROR

Sent to a specific user when their bid fails (race condition or validation error).

**Listen:**

```javascript
socket.on("OUTBID_ERROR", (data) => {
	console.error("Bid failed:", data);
	// Show error message, red flash
});
```

**Data:**

```json
{
	"message": "You were outbid! Another user placed a higher bid.",
	"code": "OUTBID",
	"currentBid": 280,
	"yourBid": 260
}
```

**Error Codes:**

- `OUTBID` - Lost race condition, another user bid first
- `AUCTION_ENDED` - Auction has ended
- `BID_TOO_LOW` - Bid is not higher than current bid
- `INVALID_INPUT` - Missing or invalid data
- `INVALID_AMOUNT` - Bid amount is not positive
- `ITEM_NOT_FOUND` - Auction item doesn't exist
- `SERVER_ERROR` - Internal server error

---

#### 4. TIME_SYNC

Server time broadcast (every 30 seconds automatically, or on request).

**Listen:**

```javascript
socket.on("TIME_SYNC", (data) => {
	const serverTime = data.serverTime;
	// Sync local countdown timer
});
```

**Data:**

```json
{
	"serverTime": 1738509000000
}
```

---

#### 5. ERROR

General error event for WebSocket operations.

**Listen:**

```javascript
socket.on("ERROR", (data) => {
	console.error("WebSocket error:", data);
});
```

**Data:**

```json
{
	"message": "Auction item not found",
	"event": "JOIN_AUCTION"
}
```

---

## Race Condition Handling

### The Problem

When multiple users bid on the same item at the exact same millisecond, we must ensure:

1. Only ONE bid succeeds
2. The highest bid wins
3. Losing bidders receive immediate feedback

### The Solution: Optimistic Locking

We use a **version field** in the `AuctionItem` model with MongoDB's atomic `findOneAndUpdate` operation.

**How it works:**

1. User A and User B both bid $100 at the same time
2. Current auction state: `currentBid: $90, version: 5`
3. Both requests read version = 5
4. Both attempt to update with condition: `version === 5`
5. MongoDB processes requests sequentially (atomic operation)
6. User A's update succeeds:
   ```javascript
   { currentBid: $100, version: 6, highestBidderId: UserA }
   ```
7. User B's update fails (version is now 6, not 5)
8. User B receives `409 OUTBID` error
9. All connected clients receive `UPDATE_BID` event with User A's bid

**Code Implementation:**

```javascript
const updatedItem = await AuctionItem.findOneAndUpdate(
  {
    _id: itemId,
    version: currentVersion,  // Optimistic lock
    currentBid: { $lt: amount },  // Ensure bid is higher
    auctionEndTime: { $gt: new Date() },  // Ensure not ended
    itemStatus: 'LIVE'
  },
  {
    $set: {
      currentBid: amount,
      highestBidderId: userId
    },
    $inc: { version: 1 }  // Increment version
  },
  { new: true }
);

if (!updatedItem) {
  // Bid failed - user was outbid
  return 409 OUTBID error
}
```

**Testing Race Conditions:**

Use tools like Apache JMeter or this simple script:

```javascript
// Simulate 10 concurrent bids
const promises = Array(10)
	.fill(null)
	.map((_, i) =>
		axios.post(
			"/api/bids",
			{
				itemId: "auction-id",
				amount: 100,
			},
			{
				headers: { Authorization: `Bearer ${tokens[i]}` },
			},
		),
	);

const results = await Promise.allSettled(promises);
// Only 1 should succeed with 201, others should get 409
```

---

## Frontend Integration Guide

### 1. Initial Setup

```javascript
import axios from "axios";
import io from "socket.io-client";

const API_BASE_URL = "http://localhost:8000";
const token = localStorage.getItem("token");

// Axios instance
const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		Authorization: `Bearer ${token}`,
	},
});

// Socket.io connection
const socket = io(API_BASE_URL, {
	auth: { token },
});
```

---

### 2. Auction Item List

```javascript
// Fetch live auctions
const { data } = await api.get("/api/items?status=LIVE");
const items = data.data.items;

// Display each item with countdown timer
items.forEach((item) => {
	displayItem(item);
	startCountdown(item.auctionEndTime);
});
```

---

### 3. Real-Time Bidding Flow

```javascript
// Join auction room when viewing an item
socket.emit("JOIN_AUCTION", { itemId });

// Listen for bid updates
socket.on("UPDATE_BID", (data) => {
	if (data.itemId === currentItemId) {
		// Update price with animation
		animatePrice(data.currentBid);

		// Update badge
		if (data.highestBidderId === myUserId) {
			showBadge("WINNING", "green");
		} else {
			showBadge("OUTBID", "red");
		}
	}
});

// Place bid
const placeBid = async (itemId, amount) => {
	try {
		// Option 1: REST API
		await api.post("/api/bids", { itemId, amount });

		// Option 2: WebSocket (recommended for real-time feel)
		socket.emit("BID_PLACED", { itemId, amount });
	} catch (error) {
		if (error.response?.status === 409) {
			showError("You were outbid!");
		}
	}
};

// Handle outbid errors (WebSocket)
socket.on("OUTBID_ERROR", (data) => {
	if (data.code === "OUTBID") {
		showError("You were outbid!", "red");
	}
});
```

---

### 4. Server Time Sync

```javascript
// Fetch server time on app load
const { data } = await api.get("/api/time");
const serverTime = data.data.serverTime;
const clientTime = Date.now();
const timeDrift = serverTime - clientTime;

// Calculate countdown using server time
const calculateTimeRemaining = (auctionEndTime) => {
	const now = Date.now() + timeDrift; // Adjust for drift
	const diff = new Date(auctionEndTime).getTime() - now;
	return Math.max(0, Math.floor(diff / 1000));
};

// Update countdown every second
setInterval(() => {
	const timeRemaining = calculateTimeRemaining(auctionEndTime);
	updateCountdownDisplay(timeRemaining);
}, 1000);
```

---

### 5. Visual Feedback

```javascript
// Green flash when new bid comes in
const animatePrice = (newPrice) => {
  const priceElement = document.querySelector('.price');
  priceElement.textContent = `$${newPrice}`;
  priceElement.classList.add('flash-green');
  setTimeout(() => priceElement.classList.remove('flash-green'), 500);
};

// CSS
.flash-green {
  animation: greenFlash 0.5s ease;
}

@keyframes greenFlash {
  0%, 100% { background-color: transparent; }
  50% { background-color: #4ade80; }
}
```

---

## Health Check

**GET** `/health`

Check if server is running.

**Success Response (200):**

```json
{
	"success": true,
	"message": "Server is running",
	"timestamp": "2026-02-02T16:30:00.000Z"
}
```

---

## Notes

### Production Considerations

1. **CORS:** Update `origin: "*"` to your frontend URL
2. **JWT Secret:** Use a strong, randomly generated secret in production
3. **Rate Limiting:** Implement rate limiting on bid endpoints
4. **Database Indexes:** Ensure indexes are created (already configured in models)
5. **Error Logging:** Integrate proper error logging (e.g., Sentry)
6. **WebSocket Scaling:** For multiple servers, use Redis adapter for Socket.io

### Testing Recommendations

1. Use Postman/Insomnia for REST API testing
2. Use Postwoman or custom script for WebSocket testing
3. Simulate concurrent users with load testing tools
4. Test countdown sync across different timezones
5. Test reconnection handling for WebSocket

---

## Support

For issues or questions, please contact the development team or open an issue in the GitHub repository.

**Happy Bidding! 🎉**
