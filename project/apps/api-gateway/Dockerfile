FROM node:22.14-alpine
WORKDIR /opt/readme-api-gateway
COPY ./dist/apps/api-gateway/package.json .
RUN npm install --omit=dev
COPY ./dist/apps/api-gateway .
CMD ["node", "./main.js"]
