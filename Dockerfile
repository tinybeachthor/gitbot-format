FROM node:10-alpine

# install dependencies
RUN apk update && apk add \
  clang \
  git
# install yarn
RUN npm install --global yarn
# install pm2
RUN yarn global add pm2

WORKDIR /gitbot-format
ADD package.json yarn.lock
RUN yarn install --production --frozen-lockfile

# add app files
COPY . .

# start
USER node
ENTRYPOINT ["pm2-docker"]
