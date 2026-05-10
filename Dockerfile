FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm install -g serve
EXPOSE 8080

# TRIK UTAMA: Pindahkan proses build ke sini!
# Ini memastikan Vite membaca API Key dari Environment Cloud Run saat server menyala
CMD npm run build && serve -s dist -l 8080
