const logger = require('./logger')

const Status = require('./status')
const { format, lint } = require('./format')

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

function handle(action, pr_info, github, status) {
  const {owner, repo, pull_number, sha, ref} = pr_info

  const task = async () => {
    logger.info(`${action}:${owner}/${repo}/${ref}:${sha} Handling`)

    try {
      switch (action) {
        case actions.FORMAT:
          await format(pr_info, github, status)
          break
        case actions.LINT:
          await lint(pr_info, github, status)
          break
      }
      logger.info(`${action}:${owner}/${repo}/${ref}:${sha} Handled`)
    }
    catch (err) {
      logger.error(`${action}:${owner}/${repo}/${ref}:${sha} Errored : ${err.name}
        ${err.message}
        ${stack in err ? err.stack : nil}`)
      status.error(err)
    }
  }

  queue.place(task)
}

async function enqueue(action, pr_info, github) {
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

  handle(action, pr_info, github, status)
}

const actions = {
  FORMAT: "FORMAT",
  LINT: "LINT",
}

module.exports = {
  enqueue,
  actions,
}
