/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = bot => {
  bot.log('Started')

  bot.on("pull_request.opened", check)
  bot.on("pull_request.synchronize", check)

  async function check (context) {
    const pull = context.issue()
		const { sha } = context.payload.pull_request.head
		const repo = context.repo()

    bot.log(`sha: ${sha}`)

    // GH API
    const { checks } = context.github;

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

    // Run formatter

    // Completed

  }

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
