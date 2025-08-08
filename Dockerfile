# Dockerfile
FROM node:20-alpine AS development-dependencies-env
COPY package*.json /app/
WORKDIR /app
RUN npm ci
COPY . /app
# Para desarrollo con hot reload
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM node:20-alpine AS production-dependencies-env
COPY package*.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:20-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM node:20-alpine AS production
COPY package*.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
EXPOSE 3000
CMD ["npm", "run", "start"]