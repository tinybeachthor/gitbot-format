const util = require('util')

const checkStatus = require('./checkStatus')
const getFiles = require('./getFiles')
const FileFormatter = require('./formatter')

async function format(context) {
  const {owner, repo, number} = context.issue()
  const {sha} = context.payload.pull_request.head

  // GH API
  const {checks, pulls, git} = context.github

  // PR check status
  const statusInfo = context.repo({
    name: "gitbot-format",
    head_sha: sha,
  })

  // Queued
  checkStatus.queued(checks, statusInfo)

  // In progress
  const started_at = new Date()
  checkStatus.progress(checks, statusInfo, started_at)

  // Get changed files
  const files = await getFiles(context.github, {
    owner,
    repo,
    pull_number: number,
  })

  files.forEach(({filename, content}) => {
    bot.log(`${filename} : ${content}`)
  })

  // Run formatter
  const formatter = FileFormatter(files)
  formatter.format()

  // If changed -> push blobs + create commit

  // Completed
  checkStatus.success(checks, checkStatus, started_at)
}
module.exports = format
