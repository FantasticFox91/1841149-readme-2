FROM node:22.14-slim
RUN apt-get update && apt-get install -y openssl libssl-dev
WORKDIR /opt/readme-post
COPY ./dist/apps/post/package.json .
RUN npm install --omit=dev
COPY ./dist/apps/post/assets/prisma/schema.prisma ./schema.prisma
RUN npx prisma generate --schema schema.prisma
RUN cp -R ../../node_modules/.prisma ./node_modules && rm -rf ../node-node_modules
COPY ./dist/apps/post .
CMD ["node", "./main.js"]
