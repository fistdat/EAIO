FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package.json package-lock.json ./

# Clean install dependencies
RUN npm ci --legacy-peer-deps
# Install the missing ajv dependency
RUN npm install ajv@8.12.0

# Copy application code
COPY . .

# Expose port 3000
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=development
ENV REACT_APP_API_URL=http://backend:8000

# Start application
CMD ["npm", "start"] 