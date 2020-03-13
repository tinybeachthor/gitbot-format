import * as core from '@actions/core'
import {GitHub, context as _context} from '@actions/github'

import Status from './status'
import {lint, format} from './actions'

async function run () {
  // Get clang-format config path
  const config_path = core.getInput('config-path')
  console.log(`Using config at '${config_path}'`)

  // Get authenticated API
  const repoToken = core.getInput('repo-token')
  const octokit = new GitHub(repoToken)

  // Check permissions
  const proactive = process.env.TAKE_ACTION ? process.env.TAKE_ACTION : false

  // Get PR details
  const context = _context
  const {owner, repo} = context.repo
  const {number: pull_number} = context.payload.issue || context.payload

  const pr = await octokit.pulls.get({
    owner,
    repo,
    pull_number,
  })
  const {sha, ref} = pr.data.head

  // Run
  const details = { owner, repo, pull_number, sha, ref }

  if (!proactive) {
    // Setup PR status check
    const status = Status(octokit.checks, {
      owner,
      repo,
      name: 'clang-format',
      head_sha: sha,
    })
    await status.queued()

    await lint(details, octokit, status)
  }
  else {
    await format(details, octokit)
  }
}

// Run action
run().catch((error) => core.setFailed(error.message))
