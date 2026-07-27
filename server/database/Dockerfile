FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY app.js dealership.js review.js ./
COPY data ./data

EXPOSE 3030

CMD ["npm", "start"]
