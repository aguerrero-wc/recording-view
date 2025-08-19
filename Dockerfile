# Dockerfile

# Stage 1: Build dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Build application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS production
# Instalar wget para healthcheck
RUN apk add --no-cache wget \
    && addgroup -g 1000 -S nodejs \
    && adduser -S nextjs -u 1000

WORKDIR /app

# Crear directorios necesarios con permisos adecuados
RUN mkdir -p .next/cache \
    && chown -R nextjs:nodejs /app

# Copiar dependencias de producción
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
# Copiar build de la aplicación
COPY --from=builder --chown=nextjs:nodejs /app/build ./build
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

# Cambiar a usuario no-root
USER nextjs

# Configuración de seguridad y rendimiento
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["npm", "run", "start"]