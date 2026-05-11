FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Tangkap API Key dengan nama VITE_
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

# Tangkap juga API Key tanpa VITE_ (karena kode AI Studio mencarinya dengan nama ini)
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

# Build aplikasi setelah variabel di atas dimasukkan
RUN npm run build

# Install web server sederhana untuk menyajikan file statis React/Vite
RUN npm install --legacy-peer-deps

# Ekspos port standar Google Cloud Run
EXPOSE 8080

# Jalankan server
CMD ["serve", "-s", "dist", "-l", "8080"]