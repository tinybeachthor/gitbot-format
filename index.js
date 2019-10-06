const logger = require('./logger')
const util = require('util')

const { enqueue, actions } = require('./dispatcher')

const Octokit = require("@octokit/rest")

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = async bot => {
  logger.info('bot starting up')

  // PR open/updated
  const enqueuePR = async (context) => {
    const {owner, repo, number} = context.issue()
    const {sha, ref} = context.payload.pull_request.head

    await enqueue(actions.FORMAT, {
      owner,
      repo,
      pull_number: number,
      sha,
      ref,
    }, context.github)
  }
  bot.on("pull_request.opened", enqueuePR)
  bot.on("pull_request.synchronize", enqueuePR)

  // Check run requested action
  const requestedFormat = async (context) => {
    const {owner, repo} = context.issue()
    const {head_branch, head_sha} = context.payload.check_run.check_suite
    console.log(owner, repo, head_branch, head_sha)
  }
  bot.on("check_run.requested_action", requestedFormat)

  // Rerun on all opened PRs
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

      prsResponse.data.forEach((pr) => {
        // enqueue for checking
        enqueue(actions.FORMAT, {
          owner: owner.login,
          repo: name,
          pull_number: pr.number,
          sha: pr.head.sha,
          ref: pr.head.ref,
        }, octokitIT)
      })
    })
  })
}
