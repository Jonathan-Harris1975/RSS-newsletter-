FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy everything else
COPY . .

# Run any setup you need (optional)
RUN node generateRSS.js

# Start the server
CMD ["node", "server.js"]
