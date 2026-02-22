# --------- Builder ---------
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --------- Production ---------
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# You only need these files for standalone output
COPY --from=builder /app/public ./public
# Automatically leverage output traces to reduce image size
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
# server.js is created by next build from the standalone output
CMD ["node", "server.js"]
