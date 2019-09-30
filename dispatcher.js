const logger = require('./logger')

const format = require('./format')

const events = require('events')
const eventEmitter = new events.EventEmitter()

const eventName = 'gitbot-format-request'

eventEmitter.on(eventName, async (pr_info, git, checks) => {
  const {owner, repo, pull_number, sha, ref} = pr_info
  logger.info(`${owner}:${repo}:${number} Handling`)
  await format(pr_info, git, checks)
  logger.info(`${owner}:${repo}:${number} Handled`)
})

function enqueue(pr_info, git, checks) {
  const {owner, repo, pull_number, sha, ref} = pr_info
  logger.info(`${owner}:${repo}:${number} Enqueued`)
  eventEmitter.emit(eventName, pr_info, git, checks)
}

module.exports = {
  enqueue,
}
