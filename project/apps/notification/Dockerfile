FROM node:22.14-alpine
WORKDIR /opt/readme-notification
COPY ./dist/apps/notification/package.json .
RUN npm install --omit=dev
COPY ./dist/apps/notification .
CMD ["node", "./main.js"]
