FROM node:lts-buster

# install dependencies
RUN apt update -y && apt install -y \
  clang-format \
  git

# install app
WORKDIR /gitbot-format
ADD package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

# add app files
COPY . .

# start
EXPOSE 3000
USER node
CMD ["yarn", "start"]
