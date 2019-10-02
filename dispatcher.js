const logger = require('./logger')

const Status = require('./status')
const format = require('./format')

const events = require('events')
const eventEmitter = new events.EventEmitter()

const eventName = 'gitbot-format-request'

eventEmitter.on(eventName, async (pr_info, github, status) => {
  const {owner, repo, pull_number, sha, ref} = pr_info
  logger.info(`${owner}:${repo}:${pull_number} Handling`)
  await format(pr_info, github, status)
  logger.info(`${owner}:${repo}:${pull_number} Handled`)
})

async function enqueue(pr_info, github) {
  const {owner, repo, pull_number, sha, ref} = pr_info

  // PR check status
  const status = Status(github.checks, {
      owner,
      repo,
      name: 'gitbot-format',
      head_sha: sha,
    })
  // Queued
  await status.queued()
  logger.info(`${owner}/${repo}/${ref}#${pull_number}:${sha} Enqueued`)

  eventEmitter.emit(eventName, pr_info, github, status)
}

module.exports = {
  enqueue,
}
