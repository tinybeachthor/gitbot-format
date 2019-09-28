const logger = require('./logger')
const format = require('./format')

const util = require('util')

const Octokit = require("@octokit/rest")

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = async bot => {
  logger.info('bot starting up')

  await setup(bot)

  logger.info('bot started up')

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}

async function setup(bot) {
  // get app data
  const octokitJWT = new Octokit({
    auth: bot.app.getSignedJsonWebToken(),
  })

  // get all installations
  const installationsResponse = await octokitJWT.apps.listInstallations()

  // get all repos
  installationsResponse.data.forEach(async (installation) => {
    const installTokenResponse = await octokitJWT.apps.createInstallationToken({
      installation_id: installation.id,
    })

    const octokitIT = new Octokit({
      auth: installTokenResponse.data.token,
    })

    const reposResponse = await octokitIT.apps.listRepos()
    reposResponse.data.repositories.forEach(async ({ name, owner }) => {
      const prsResponse = await octokitIT.pulls.list({
        owner: owner.login,
        repo: name,
      })
      console.log(util.inspect(prsResponse.data))
    })
  })

  // bot.on("pull_request.opened", format)
  // bot.on("pull_request.synchronize", format)
}
