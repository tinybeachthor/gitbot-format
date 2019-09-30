const logger = require('./logger')

const { enqueue } = require('./dispatcher')

const util = require('util')

const Octokit = require("@octokit/rest")

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = async bot => {
  logger.info('bot starting up')

  const enqueuePR = (context) => {
    const {owner, repo, number} = context.issue()
    const {sha, ref} = context.payload.pull_request.head

    // GH API
    const {checks, git} = context.github

    enqueue({
      owner,
      repo,
      pull_number: number,
      sha,
      ref,
    }, git, checks)
  }
  bot.on("pull_request.opened", enqueuePR)
  bot.on("pull_request.synchronize", enqueuePR)

  await recheckOpened(bot)

  logger.info('bot started up')

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}

async function recheckOpened(bot) {
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
        state: 'open',
      })
      console.log(util.inspect(prsResponse.data))

      // enqueue for checking
      enqueue({
        owner: owner.login,
        repo: name,
        pull_number: prsResponse.data.number,
        sha: prsResponse.data.head.sha,
        ref: prsResponse.data.head.ref,
      }, octokitIT.git, octokitIT.checks)
    })
  })
}
