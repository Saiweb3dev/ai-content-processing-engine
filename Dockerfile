FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies including development ones
RUN npm install

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# We'll use the start command from docker-compose.yml
CMD ["npm", "run", "dev"]