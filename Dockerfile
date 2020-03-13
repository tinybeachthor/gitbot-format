FROM node:10-alpine

# install dependencies
RUN apk update && apk add \
  clang \
  git

# install app
WORKDIR /gitbot-format
ADD package.json package-lock.json ./
RUN npm install --production --frozen-lockfile

# add app files
COPY ./dist/ ./out/

# start
USER node
CMD ["npm", "run", "start"]
