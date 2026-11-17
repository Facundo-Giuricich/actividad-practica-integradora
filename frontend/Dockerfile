FROM node:24-alpine
WORKDIR /app

COPY package.json package-lock.json ./
# npm install (no npm ci): el lockfile se genera en Windows y npm omite las dependencias
# opcionales de Linux que necesita Vite (bug conocido de npm). install respeta las
# versiones del lockfile y completa las que faltan para esta plataforma.
RUN npm install --no-audit --no-fund

COPY . .

# Vite "hornea" las variables VITE_* en el JS al compilar, por eso la URL de la API
# llega como argumento de build (desde docker-compose.yml) y no en tiempo de ejecución.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

EXPOSE 5173
# vite preview sirve la carpeta dist/ ya compilada.
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
