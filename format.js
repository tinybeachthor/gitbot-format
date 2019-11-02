const logger = require('./logger')
const util = require('util')

const formatter = require('./formatter')
const { getStylefile, getPRFileList, getFile, generateAnnotations }
  = require('./hub')

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function format(
  {owner, repo, pull_number, sha, ref},
  {checks, git, pulls, repos},
  status
) {
  const info = (message) =>
    logger.info(`${owner}/${repo}/${ref}:${sha}: ${message}`)

  // In progress
  await status.progress(new Date())
  info('In Progress')

  // Check if exists and get /.clang-format
  const style = await getStylefile({owner, repo, ref}, repos, info)

  // Get changed files
  const files = await getFiles({git,pulls}, {
    owner,
    repo,
    pull_number,
  })
  const filenames = files.resolved.reduce((acc, {filename}) => `${acc}${filename};`, '')
  info(`Got PR's changed files : ${filenames}`)
  const filenamesErrored = files.errored.reduce((acc, {filename}) => `${acc}${filename};`, '')
  filenamesErrored.length && info(`Couldn't get PR files : ${filenamesErrored}`)

  // Run formatter
  const changedFiles = await formatter(files.resolved, style)
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

      info(`Create blob for: ${filename}`)

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

async function lint(
  {owner, repo, pull_number, sha, ref},
  {checks, git, pulls, repos},
  status
) {
  const info = (message) =>
    logger.info(`${owner}/${repo}/${ref}:${sha}: ${message}`)
  const error = (message) =>
    logger.error(`${owner}/${repo}/${ref}:${sha}: ${message}`)

  // In progress
  await status.progress(new Date())
  info('In Progress')

  // Check if exists and get /.clang-format
  const style = await getStylefile({owner, repo, ref}, repos, info)

  // Get PR file list
  pr_filenames = await getPRFileList(pulls, {owner, repo, pull_number})
  const filenames = pr_filenames.reduce((acc, {filename}) => `${acc}${filename};`, '')
  info(`Got PR's changed files : ${filenames}`)

  // Process files
  skipped_filenames = []
  touched_lines = []
  annotations = []
  await asyncForEach(pr_filenames, async ({filename, sha}) => {
    info(`Processing ${filename}`)

    // Get file
    const file = await getFile({pulls, git}, {owner, repo, filename, sha})
    if (file.exception || !file.content) {
      error(`Error getting ${filename}`)
      skipped_filenames.push(filename)
      return
    }

    // Format file
    const [changed] = await formatter([file], style)
    if (!changed) {
      return
    }

    // Generate annotations
    const file_annotations = generateAnnotations(changed, file)

    touched_lines = Number(file_annotations.lines) + Number(touched_lines)
    annotations = annotations.concat(file_annotations.annotations)
  })
  const filenamesErrored =
    skipped_filenames.reduce((acc, {filename}) => `${acc}${filename};`, '')
  filenamesErrored.length && info(`Couldn't get PR files : ${filenamesErrored}`)

  // If files touched -> check status annotations
  if (touched_lines > 0 || annotations.length > 0) {
    info(`Touuched ${touched_lines} lines`)
    await status.failure(annotations, touched_lines)
  }
  else {
    info('No files touched')
    await status.success()
  }
  info('Completed')
}

module.exports = {
  lint,
  format,
}
