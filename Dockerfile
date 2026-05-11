FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
# Use legacy-peer-deps as the user had before
RUN npm install --legacy-peer-deps

COPY . .

# We inject environment variables at runtime, but we left these ARG here as requested
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

RUN npm run build

# Start the full-stack server
EXPOSE 8080

CMD ["npm", "start"]
