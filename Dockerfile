FROM node:10-buster-slim

# install dependencies
RUN apt update -y && apt install -y \
  clang-format \
  git

# install app
WORKDIR /gitbot-format
ADD package.json package-lock.json ./
RUN npm install --production --frozen-lockfile

# add app files
COPY . .

# start
EXPOSE 3000
USER node
CMD ["npm", "run", "start"]
