FROM node:22.14-alpine
WORKDIR /opt/readme-file-storage
COPY ./dist/apps/file-storage/package.json .
RUN npm install --omit=dev
COPY ./dist/apps/file-storage .
RUN mkdir -p /opt/uploads
CMD ["node", "./main.js"]
