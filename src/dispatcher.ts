import logger from './logger'
import Status from './status'
import { format, lint } from './actions'

import { PullRequestInfo, PullRequestInfoFull, Checkrun } from './types.d'

type Task = () => Promise<void>
interface TaskQueue {
  place(task: Task): void
  next(): Promise<void>
  active: boolean
}

function makeQueue(): TaskQueue {
  const queue: Task[] = []
  let active = false

  function place (task: Task): void {
    queue.push(task)
    active || next()
  }
  async function next (): Promise<void> {
    if (!queue.length) {
      active = false
      return
    }
    active = true
    const task = queue.shift()
    task && await task()
    next()
  }

  return {
    place,
    next,
    active,
  }
}

const queue = makeQueue()

function handle(action: string, pr_info: PullRequestInfo, github: any, status: Checkrun) {
  const {owner, repo, sha, ref} = pr_info

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
        ${err.message}`)
      status.error(err)
    }
  }

  queue.place(task)
}

async function enqueue(action: string, pr_info: PullRequestInfoFull, github: any) {
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
