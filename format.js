const util = require('util')

const checkStatus = require('./checkStatus')
const getFiles = require('./getFiles')
const FileFormatter = require('./formatter')

async function format(context) {
  const {owner, repo, number} = context.issue()
  const {sha, ref} = context.payload.pull_request.head

  // GH API
  const {checks, pulls, git} = context.github

  console.log(sha)
  console.log(ref)

  // PR check status
  const statusInfo = context.repo({
    name: 'gitbot-format',
    'head_sha': sha,
  })

  // Queued
  await checkStatus.queued(checks, statusInfo)

  // In progress
  const started_at = new Date()
  await checkStatus.progress(checks, statusInfo, started_at)

  // Get changed files
  const files = await getFiles(context.github, {
    owner,
    repo,
    pull_number: number,
  })

  // Run formatter
  const formatter = FileFormatter(files)
  formatter.format()

  // If changed -> push blobs + create tree + create commit
  const changedFiles = formatter.touched()

  if (changedFiles.length > 0) {
    // push new blobs
    const blobsPromises = []
    changedFiles.forEach(({ content, filename }) => {
      const promise = git
        .createBlob({
          owner,
          repo,
          content,
          encoding: "utf-8",
        })
        .then(({data}) => {
          return { sha: data.sha, filename }
        })
      blobsPromises.push(promise)
    })
    const blobs = await Promise.all(blobsPromises)

    // create tree
    const tree = []
    blobs.forEach(({ sha, filename }) => {
      tree.push({
        mode: '100644', // blob (file)
        type: 'blob',
        path: filename,
        sha,
      })
    })
    const treeResponse = await git.createTree({
      owner,
      repo,
      tree,
      base_tree: sha,
    })

    // create commit
    const commitResponse = await git.createCommit({
      owner,
      repo,
      message: 'gitbot-format: automated code format',
      tree: treeResponse.data.sha,
      parents: [sha],
    })

    // update branch reference
    const referenceResponse = await git.updateRef({
      owner,
      repo,
      ref: `heads/${ref}`,
      sha: commitResponse.data.sha,
      force: false,
    })

    console.log(util.inspect(referenceResponse.data))
  }

  // Completed
  await checks.create({
    ...statusInfo,
    status: "completed",
    started_at,
    completed_at: new Date(),
    conclusion: "success",
    output: {
      title: 'gitbot-format',
      summary: 'Formatted all right!'
    },
  })
}
module.exports = format
