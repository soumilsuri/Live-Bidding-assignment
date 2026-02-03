# Live Bidding Platform - Frontend

React frontend for the Live Bidding Platform with real-time WebSocket updates.

## Features

- 🔐 JWT-based authentication (Login/Signup)
- ⏱️ Server-synced countdown timers
- 💰 Real-time bidding with WebSocket
- 🎯 Quick bid (+$10) and custom bid amount
- ✨ Visual feedback (green/red flash animations)
- 🏆 Status badges (Winning/Outbid)
- 📱 Responsive design with Tailwind CSS

## Tech Stack

- React 18+ with Vite
- Tailwind CSS
- Socket.io-client
- Axios
- React Router

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (optional, defaults to localhost:8000):
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=http://localhost:8000
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── auth/          # Login, Signup components
│   ├── auction/       # AuctionCard, CountdownTimer, BidButton, BidInput, StatusBadge
│   └── layout/        # Navbar, ProtectedRoute, ErrorBoundary
├── contexts/          # AuthContext, SocketContext, TimeSyncContext
├── hooks/            # Custom hooks (useAuth, useSocket, useAuction, useTimeSync)
├── pages/             # Dashboard, LoginPage, SignupPage
├── services/          # API service, Socket service
└── utils/             # Time sync utilities, constants
```

## Usage

1. Sign up or log in
2. View live auctions on the dashboard
3. Place bids using:
   - Quick bid button (+$10)
   - Custom bid input (enter any amount)
4. Watch real-time updates via WebSocket
5. See visual feedback when bids are placed or outbid

## Environment Variables

- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:8000)
- `VITE_WS_URL` - WebSocket URL (default: http://localhost:8000)
