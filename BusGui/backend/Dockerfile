FROM arm64v8/node:14 AS build

# Make directory for build
RUN mkdir /app/server

# Set work directory
WORKDIR /app/server

# Copy package.json
COPY package*.json ./

# Install Dependencies
RUN npm install

# Copy Source
COPY . .

# Build Source
RUN npm run build

# Build Binary
RUN npm run build-bin-arm64linux

FROM build as export

# Copy built binary
COPY --from=build /app/bin/busgui-backend .