FROM node:10-alpine

# install dependencies
RUN apk update && apk add \
  clang \
  git
# install yarn
RUN npm install --global yarn

WORKDIR /gitbot-format
ADD package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

# add app files
COPY . .

# start
EXPOSE 3000
USER node
CMD ["yarn", "start"]
