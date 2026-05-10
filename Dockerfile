# Gunakan node versi 22 agar kompatibel dengan Tailwind/Vite terbaru
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# BUKA PINTU UNTUK MENERIMA API KEY DARI CLOUD RUN
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

# Build aplikasi dengan membawa API Key tersebut
RUN npm run build

RUN npm install -g serve
EXPOSE 8080

CMD ["serve", "-s", "dist", "-l", "8080"]
