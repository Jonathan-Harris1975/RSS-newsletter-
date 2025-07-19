FROM node:18
WORKDIR /app
COPY . .
RUN npm install
RUN node generateRSS.js
CMD ["node", "server.js"]
