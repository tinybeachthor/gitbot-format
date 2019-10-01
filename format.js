const logger = require('./logger')

const util = require('util')

const Status = require('./status')
const getFiles = require('./getFiles')
const formatter = require('./formatter')

const stylefileName = '.clang-format'

async function getStylefile({owner, repo, ref}, repos, info) {
  try {
    const stylefileResponse = await repos.getContents({
      owner,
      repo,
      path: stylefileName,
      ref,
    })
    const buffer = Buffer.from(stylefileResponse.data.content, 'base64')
    const text = buffer.toString('utf8')

    info('Got stylefile')
    return text
  }
  catch (e) {
    console.log(util.inspect(e))
    info('Could not get stylefile, falling back to defaults.')
    return null
  }
}

async function format(
  {owner, repo, pull_number, sha, ref},
  {checks, git, pulls, repos}
) {
  const info = (message) =>
    logger.info(`${owner}/${repo}/${ref}:${sha}: ${message}`)

  // PR check status
  const status = Status(checks, {
      owner,
      repo,
      name: 'gitbot-format',
      head_sha: sha,
    })

  // Queued
  await status.queued()
  info('Queued')

  // Check if exists and get /.clang-format
  const stylefile = await getStylefile({owner, repo, ref}, repos, info)

  // In progress
  await status.progress(new Date())
  info('In Progress')

  // Get changed files
  const files = await getFiles({git,pulls}, {
    owner,
    repo,
    pull_number,
  })
  const filenames = files.reduce((acc, {filename}) => `${acc}${filename},`, '')
  info(`Got PR's changed files : ${filenames}`)

  // Run formatter
  const changedFiles = await formatter(files)
  info('Formatted')

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
    info('Created blobs')

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
    info('Created tree')

    // create commit
    const commitResponse = await git.createCommit({
      owner,
      repo,
      message: 'gitbot-format: automated code format',
      tree: treeResponse.data.sha,
      parents: [sha],
    })
    info('Created commit')

    // update branch reference
    const referenceResponse = await git.updateRef({
      owner,
      repo,
      ref: `heads/${ref}`,
      sha: commitResponse.data.sha,
      force: false,
    })
    info('Updated ref')
  }
  else {
    info('No files touched')
  }

  // Completed
  await status.success()
  info('Completed')
}
module.exports = format
