FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install -g npm@latest && \
    npm ci --only=production && \
    npm uninstall -g npm

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]