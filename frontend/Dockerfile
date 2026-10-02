FROM node:22-bookworm-slim AS build
WORKDIR /workspace
COPY frontend/provider/package*.json ./frontend/provider/
COPY frontend/marketplace/package*.json ./frontend/marketplace/
COPY frontend/admin/package*.json ./frontend/admin/
RUN cd frontend/provider && npm ci --no-audit --no-fund
RUN cd frontend/marketplace && npm ci --no-audit --no-fund
RUN cd frontend/admin && npm ci --no-audit --no-fund
COPY frontend/ ./frontend/
RUN cd frontend/provider && npm run build
RUN cd frontend/marketplace && npm run build
RUN cd frontend/admin && npm run build

FROM nginx:stable-alpine
ARG APP=marketplace
COPY --from=build /workspace/frontend/${APP}/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
