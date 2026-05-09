# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_SERVER_URL is baked into the JS bundle at build time.
# Override via --build-arg or the compose file.
ARG VITE_SERVER_URL=https://wrod-1.onrender.com
ENV VITE_SERVER_URL=$VITE_SERVER_URL

RUN npm run build

# ── Serve stage ───────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
