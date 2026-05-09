# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ .
RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# words.txt lives one level above the backend in the project layout.
# At runtime __dirname is /app/backend/dist/config, so 3 levels up = /app.
WORKDIR /app
COPY words.txt .

WORKDIR /app/backend
COPY --from=build /app/backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/backend/dist ./dist

EXPOSE 3001

CMD ["node", "dist/index.js"]
