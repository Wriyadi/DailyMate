FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Ini menerima variabel dari argumen Cloud Build
ARG VITE_GEMINI_API_KEY
# Ini meneruskannya ke lingkungan build Vite
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

RUN npm run build

RUN npm install -g serve
EXPOSE 8080

CMD ["serve", "-s", "dist", "-l", "8080"]
