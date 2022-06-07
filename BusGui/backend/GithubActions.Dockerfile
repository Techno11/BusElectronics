FROM arm64v8/node:14-alpine AS build

# Install dependencies for node-gyp
RUN apk add --no-cache make gcc g++ python3 linux-headers udev

# Make directory for build
RUN mkdir -p /app/server

# Set work directory
WORKDIR /app/server

# Copy package.json
COPY ./BusGui/backend/package*.json ./

# Install Dependencies
RUN npm install

# Copy Source
COPY ./BusGui/backend .

# Build Source
RUN npm run build

# Build Binary
RUN npm run build-bin-arm64linux

FROM build as export

# Copy built binary
COPY --from=build /app/bin/busgui-backend ./
