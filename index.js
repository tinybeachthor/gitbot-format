const util = require('util')

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = bot => {
  bot.log('Started')

  bot.on("pull_request.opened", check)
  bot.on("pull_request.synchronize", check)

  async function check (context) {
    const { owner, repo, number } = context.issue()
		const { sha } = context.payload.pull_request.head

    // GH API
    const { checks, pulls, git } = context.github

		// Set PR check status
    const statusInfo = context.repo({
      name: "gitbot-format",
      head_sha: sha,
    })

    // Pending
    await checks.create({
      ...statusInfo,
      status: "queued",
    })

    // Get changed files
    const files = await pulls.listFiles({
      owner,
      repo,
      pull_number: number,
    })

    files.data.forEach(({ filename, sha }) => {
      bot.log(`\t${filename}`)
      git.getBlob({
        owner,
        repo,
        file_sha: sha,
      }).then(({ data }) => {
        bot.log(util.inspect(data))
        const buffer = Buffer.from(data.content, 'base64')
        const text = buffer.toString('ascii')
        bot.log(text)
      })
    })

    // Run formatter

    // Completed

  }

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
