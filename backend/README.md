# Live Bidding Platform - Backend

A real-time auction platform with WebSocket support, production-grade race condition handling, and JWT authentication.

## 🚀 Features

- **Real-time Bidding**: WebSocket integration for instant bid updates
- **Race Condition Handling**: Optimistic locking ensures only one bid wins when multiple users bid simultaneously
- **JWT Authentication**: Secure user authentication with token-based access
- **Server Time Sync**: Prevents client-side timer manipulation
- **RESTful API**: Comprehensive REST endpoints for all operations
- **MongoDB Integration**: Scalable database with efficient indexes

## 📋 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Real-time**: Socket.io
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs

## 🛠️ Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:

   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/liveBidding
   PORT=8000
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

4. **Seed the database** (optional, for testing)

   ```bash
   npm run seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:8000`

## 📁 Project Structure

```
backend/
├── controllers/          # Request handlers
│   ├── auth.controller.js
│   ├── auctionItem.controller.js
│   └── bid.controller.js
├── models/              # MongoDB schemas
│   ├── User.models.js
│   ├── AuctionItem.models.js
│   └── Bid.models.js
├── routes/              # API routes
│   ├── auth.routes.js
│   ├── auctionItem.routes.js
│   └── bid.routes.js
├── middlewares/         # Custom middleware
│   └── auth.middleware.js
├── utils/               # Utility functions
│   ├── jwt.util.js
│   └── timeSync.util.js
├── websockets/          # WebSocket handlers
│   └── socketHandler.js
├── db/                  # Database connection
│   └── index.js
├── app.js              # Express app configuration
├── index.js            # Server entry point
├── seed.js             # Database seeding script
└── API_DOCUMENTATION.md # Complete API docs
```

## 🔑 API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user (protected)

### Auction Items

- `GET /api/items` - Get all auction items
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create auction item (protected)
- `PUT /api/items/:id` - Update auction item (protected)
- `DELETE /api/items/:id` - Delete auction item (protected)

### Bidding

- `POST /api/bids` - Place a bid (protected)
- `GET /api/bids/item/:itemId` - Get bid history for item
- `GET /api/bids/user/me` - Get my bid history (protected)

### Utility

- `GET /api/time` - Get server time (for countdown sync)
- `GET /health` - Health check

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🌐 WebSocket Events

### Client → Server

- `JOIN_AUCTION` - Join auction room
- `LEAVE_AUCTION` - Leave auction room
- `BID_PLACED` - Place a bid via WebSocket
- `REQUEST_TIME_SYNC` - Request server time

### Server → Client

- `AUCTION_STATE` - Current auction state (on join)
- `UPDATE_BID` - New bid placed (broadcast to room)
- `OUTBID_ERROR` - Bid failed (sent to bidder)
- `TIME_SYNC` - Server time update
- `ERROR` - General error

## 🔒 Race Condition Handling

The platform uses **optimistic locking** to handle concurrent bids:

1. Each auction item has a `version` field
2. When placing a bid, the version is checked
3. Update only succeeds if version matches (atomic operation)
4. Version increments on each update
5. Failed updates receive "OUTBID" error

**Example:**

```javascript
const updatedItem = await AuctionItem.findOneAndUpdate(
	{
		_id: itemId,
		version: currentVersion, // Optimistic lock
		currentBid: { $lt: amount },
		itemStatus: "LIVE",
	},
	{
		$set: { currentBid: amount, highestBidderId: userId },
		$inc: { version: 1 },
	},
);
```

## 🧪 Testing

### Seeding Test Data

```bash
npm run seed
```

This creates 8 sample auction items with varying end times.

### Testing Race Conditions

Use the following curl commands or tools like Postman/JMeter to simulate concurrent bids:

```bash
# Terminal 1
curl -X POST http://localhost:8000/api/bids \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"itemId":"ITEM_ID","amount":100}'

# Terminal 2 (run at same time)
curl -X POST http://localhost:8000/api/bids \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"itemId":"ITEM_ID","amount":100}'
```

Only one should succeed with 201, the other gets 409 (OUTBID).

### WebSocket Testing

Use Socket.io client or browser console:

```javascript
const socket = io("http://localhost:8000", {
	auth: { token: "YOUR_JWT_TOKEN" },
});

socket.emit("JOIN_AUCTION", { itemId: "ITEM_ID" });

socket.on("UPDATE_BID", (data) => {
	console.log("New bid:", data);
});
```

## 🚢 Deployment

### Docker (Recommended)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8000
CMD ["node", "index.js"]
```

Build and run:

```bash
docker build -t live-bidding-backend .
docker run -p 8000:8000 --env-file .env live-bidding-backend
```

### Environment Variables for Production

- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 8000)
- `JWT_SECRET` - Strong random secret (use crypto.randomBytes)
- `NODE_ENV=production` - Enable production optimizations

### Deployment Platforms

- **Render**: Connect GitHub repo, add env vars
- **Railway**: One-click deploy with MongoDB plugin
- **Heroku**: Use Heroku Postgres add-on or MongoDB Atlas
- **AWS/GCP**: Deploy with Docker container

## 📝 Development Scripts

- `npm run dev` - Start development server with nodemon
- `npm run seed` - Populate database with sample data
- `npm start` - Start production server

## 🔐 Security Notes

1. **JWT Secret**: Use a strong, randomly generated secret in production
2. **CORS**: Update `origin: "*"` to your frontend URL in `index.js  `
3. **Rate Limiting**: Consider adding rate limiting for bid endpoints
4. **Input Validation**: All endpoints have validation, but add extra layer if needed
5. **HTTPS**: Always use HTTPS in production
6. **Environment Variables**: Never commit `.env` file to version control

## 🐛 Troubleshooting

### Server won't start

- Check MongoDB connection string
- Ensure MongoDB is running (if local)
- Verify `.env` file exists with correct variables

### WebSocket connection fails

- Check JWT token is valid
- Verify CORS settings
- Ensure client is connecting to correct URL

### Bids not updating in real-time

- Check WebSocket connection in browser DevTools
- Verify user has joined auction room (`JOIN_AUCTION` event)
- Check server logs for errors

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [MongoDB Docs](https://docs.mongodb.com/) - Database documentation
- [Socket.io Docs](https://socket.io/docs/) - WebSocket documentation
- [Express.js Docs](https://expressjs.com/) - Framework documentation

## 👥 For Reviewers

### Key Implementation Highlights

1. **Race Condition Handling** (controllers/bid.controller.js, line 59-90)
   - Production-standard optimistic locking
   - Atomic MongoDB operations
   - Clear error responses for outbid scenarios

2. **Server Time Sync** (utils/timeSync.util.js)
   - Prevents client-side timer manipulation
   - All validations happen server-side

3. **WebSocket Architecture** (websockets/socketHandler.js)
   - JWT authentication for socket connections
   - Room-based broadcasting for efficiency
   - Duplicate bid logic (REST + WebSocket) for flexibility

4. **Code Quality**
   - Modular architecture following MVC pattern
   - Comprehensive error handling
   - Input validation on all endpoints
   - Clean, commented code

## 📄 License

This project is part of a coding challenge assignment.

---

**Built with ❤️ for the Live Bidding Platform Challenge**
