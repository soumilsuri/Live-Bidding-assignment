## Live Bidding Assignment

This repository contains a full-stack real-time auction platform with:

- **Backend**: Node.js, Express, MongoDB, Socket.io
- **Frontend**: React (Vite)
- **Infrastructure**: Docker and Docker Compose for local development

---

## API Documentation

Full API docs (REST + WebSocket + race-condition handling) are available in:

- `backend/API_DOCUMENTATION.md`

---

## Running the project with Docker

### Prerequisites

- Docker installed
- Docker Compose installed

### 1. Build and start all services

From the project root:

```bash
docker-compose up --build
```

This will start:

- **backend** at `http://localhost:8000`
- **frontend** at `http://localhost:3000`
- **mongo** on port `27017` (for local development)

### 2. MongoDB configuration

- By default, `docker-compose.yml` starts a `mongo` container and sets:

  - `MONGODB_URI=mongodb://mongo:27017/livebidding`

- If you provide a `MONGODB_URI` from your host environment or a `.env` file in `backend`, that value will override the default and the backend will connect to that external MongoDB instead.

### 3. Environment variables

Create a `.env` file inside `backend` for local development (example):

```bash
PORT=8000
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=mongodb://mongo:27017/livebidding
```

You can omit `MONGODB_URI` to use the default specified in `docker-compose.yml`, or point it to any other MongoDB instance as needed.

---

## Running without Docker (optional)

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Make sure your backend `PORT` and frontend API base URL match when running without Docker.
