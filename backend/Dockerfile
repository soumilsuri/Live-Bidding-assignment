FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

ENV NODE_ENV=production

EXPOSE 8000

CMD ["node", "index.js"]

