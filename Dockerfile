FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN node generateRSS.js

CMD ["node", "server.js"]
