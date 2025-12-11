FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies (copy lock files first for better caching)
COPY package*.json ./
# Use npm install for development-friendly container
RUN npm install --silent

# Copy app source
COPY . .

# Expose app port
EXPOSE 3000

# Default command
CMD ["npm", "start"]
