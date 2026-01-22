FROM node:20-alpine AS build
WORKDIR /app

ARG VERSION=unknown
ENV VITE_APP_VERSION=$VERSION

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
ARG VERSION=unknown

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80