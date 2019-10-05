const logger = require('./logger')

const Status = require('./status')
const format = require('./format')

function Queue() {
  const queue = []
  queue.active = false

  queue.place = function (command) {
    queue.push(command)
    if (!queue.active) queue.next()
  }
  queue.next = async function () {
    if (!queue.length) {
      queue.active = false
      return
    }
    var command = queue.shift()
    queue.active = true
    await command()
    queue.next()
  }
  return queue
}
const queue = Queue()

function handle(pr_info, github, status) {
  const {owner, repo, pull_number, sha, ref} = pr_info

  const task = async () => {
    logger.info(`${owner}:${repo}:${pull_number} Handling`)
    await format(pr_info, github, status)
    logger.info(`${owner}:${repo}:${pull_number} Handled`)
  }

  queue.place(task)
}

async function enqueue(pr_info, github) {
  const {owner, repo, pull_number, sha, ref} = pr_info

  // PR status check
  const status = Status(github.checks, {
      owner,
      repo,
      name: 'gitbot-format',
      head_sha: sha,
    })

  // Queued
  await status.queued()
  logger.info(`${owner}/${repo}/${ref}#${pull_number}:${sha} Enqueued`)

  handle(pr_info, github, status)
}

module.exports = {
  enqueue,
}
