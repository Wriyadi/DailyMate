# Gunakan image Node.js yang ringan
FROM node:22-alpine

# Set direktori kerja di dalam container
WORKDIR /app

# Salin file dependensi dan install
COPY package*.json ./
RUN npm install

# Salin seluruh kode sumber DailyMate
COPY . .

# Build aplikasi Vite untuk production
RUN npm run build

# Install 'serve' untuk menjalankan file statis hasil build
RUN npm install -g serve

# Ekspos port 8080 (standar Cloud Run)
EXPOSE 8080

# Jalankan server
CMD ["serve", "-s", "dist", "-l", "8080"]
