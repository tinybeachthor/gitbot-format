FROM node:10-alpine

# install dependencies
RUN apk update && apk add \
  clang \
  git

# install app
WORKDIR /gitbot-format
ADD package.json package-lock.json ./
RUN npm install --frozen-lockfile

# add app files
COPY . .

# build
RUN npm run build

# start
USER node
CMD ["node", "/gitbot-format/out/index.js"]
