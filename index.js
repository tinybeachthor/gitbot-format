const format = require('./format')

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = bot => {
  bot.on("pull_request.opened", format)
  bot.on("pull_request.synchronize", format)

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
