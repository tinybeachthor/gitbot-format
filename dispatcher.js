const logger = require('./logger')

const format = require('./format')

const events = require('events')
const eventEmitter = new events.EventEmitter()

const eventName = 'gitbot-format-request'

eventEmitter.on(eventName, async (pr_info, github) => {
  const {owner, repo, pull_number, sha, ref} = pr_info
  logger.info(`${owner}:${repo}:${pull_number} Handling`)
  await format(pr_info, github)
  logger.info(`${owner}:${repo}:${pull_number} Handled`)
})

function enqueue(pr_info, github) {
  const {owner, repo, pull_number, sha, ref} = pr_info
  logger.info(`${owner}:${repo}:${pull_number} Enqueued`)
  eventEmitter.emit(eventName, pr_info, github)
}

module.exports = {
  enqueue,
}
