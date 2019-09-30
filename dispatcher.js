const logger = require('./logger')

const format = require('./format')

const events = require('events')
const eventEmitter = new events.EventEmitter()

const eventName = 'gitbot-format-request'

eventEmitter.on(eventName, async (context) => {
  const {owner, repo, number} = context.issue()
  logger.info(`${owner}:${repo}:${number} Handling`)
  await format(context)
  logger.info(`${owner}:${repo}:${number} Handled`)
})

function enqueue(context) {
  const {owner, repo, number} = context.issue()
  logger.info(`${owner}:${repo}:${number} Enqueued`)
  eventEmitter.emit(eventName, context)
}

module.exports = {
  enqueue,
}
