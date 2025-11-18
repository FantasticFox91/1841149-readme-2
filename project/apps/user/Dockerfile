FROM node:22.14-alpine
WORKDIR /opt/readme-users
COPY ./dist/apps/user/package.json .
RUN npm install --omit=dev
COPY ./dist/apps/user .
CMD ["node", "./main.js"]
