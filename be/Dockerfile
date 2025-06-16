FROM node:lts
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY /dist /app/dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
