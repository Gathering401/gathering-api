FROM node:22.13.1-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22.13.1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/knexfile.js ./knexfile.js
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "dist/app.js"]
