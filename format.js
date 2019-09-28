const util = require('util')

const Status = require('./status')
const getFiles = require('./getFiles')
const formatter = require('./formatter')

async function format(context) {
  const {owner, repo, number} = context.issue()
  const {sha, ref} = context.payload.pull_request.head

  // GH API
  const {checks, pulls, git} = context.github

  // PR check status
  const status = Status(context.github.checks,
    context.repo({
      name: 'gitbot-format',
      'head_sha': sha,
    })
  )

  // Queued
  await status.queued()

  // In progress
  await status.progress(new Date())

  // Get changed files
  const files = await getFiles(context.github, {
    owner,
    repo,
    pull_number: number,
  })

  // Run formatter
  const changedFiles = await formatter(files)

  // If changed -> push blobs + create tree + create commit
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
  await status.success()
}
module.exports = format
