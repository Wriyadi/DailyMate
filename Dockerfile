FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
# 1. TAMBAHKAN --legacy-peer-deps DI SINI (Saat menginstal dependencies aplikasi)
RUN npm install --legacy-peer-deps

COPY . .

ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

RUN npm run build

# 2. KEMBALIKAN BARIS INI SEPERTI SEMULA (Untuk menginstal web server)
RUN npm install -g serve

EXPOSE 8080

CMD ["serve", "-s", "dist", "-l", "8080"]