# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Day 1 managed container: show the eject banner by default
ARG NEXT_PUBLIC_SHOW_EJECT_BANNER=true
ENV NEXT_PUBLIC_SHOW_EJECT_BANNER=$NEXT_PUBLIC_SHOW_EJECT_BANNER

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
