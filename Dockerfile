FROM node:18

WORKDIR /app

COPY . .

RUN npm install
RUN npm run generate

EXPOSE 3000

CMD ["node", "server.js"]
