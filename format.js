const logger = require('./logger')
const util = require('util')

const { structuredPatch } = require('diff')
const yaml = require('js-yaml')

const getFiles = require('./getFiles')
const formatter = require('./formatter')

const stylefileName = '.clang-format'

async function getStylefile({owner, repo, ref}, repos, info) {
  // try getting stylefile from default branch (master) first
  try {
    const stylefileResponse = await repos.getContents({
      owner,
      repo,
      path: stylefileName,
    })
    const buffer = Buffer.from(stylefileResponse.data.content, 'base64')
    const text = buffer.toString('utf8')

    // flatten YAML docs into single and convert YAML to JSON
    const json = JSON.stringify(yaml.safeLoadAll(text).reduce((acc, doc) => {
      Object.keys(doc).forEach((key) => acc[key] = doc[key])
      return acc
    }), {})

    info(`Got stylefile from default branch : ${json}`)
    return json
  }
  // try getting stylefile from current branch
  catch (e) {
    info('Could not get stylefile from default branch, trying PR branch.')
    try {
      const stylefileResponse = await repos.getContents({
        owner,
        repo,
        path: stylefileName,
        ref,
      })
      const buffer = Buffer.from(stylefileResponse.data.content, 'base64')
      const text = buffer.toString('utf8')

      // flatten YAML docs into single and convert YAML to JSON
      const json = JSON.stringify(yaml.safeLoadAll(text).reduce((acc, doc) => {
        Object.keys(doc).forEach((key) => acc[key] = doc[key])
        return acc
      }), {})

      info(`Got stylefile from PR branch : ${json}`)
      return json
    }
    // no stylefile anywhere, use default styling
    catch (e) {
      info('Could not get stylefile, falling back to defaults.')
      return null
    }
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
  const filenames = files.reduce((acc, {filename}) => `${acc}${filename};`, '')
  info(`Got PR's changed files : ${filenames}`)

  // Run formatter
  const changedFiles = await formatter(files, style)
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
  const filenames = files.reduce((acc, {filename}) => `${acc}${filename};`, '')
  info(`Got PR's changed files : ${filenames}`)

  // Run formatter
  const changedFiles = await formatter(files, style)
  info('Formatted')

  // If files touched -> check status annotations
  if (changedFiles.length > 0) {
    const {annotations, lines} = generateAnnotation(changedFiles, files)
    await status.failure(annotations, lines)
  }
  else {
    info('No files touched')
    await status.success()
  }
  info('Completed')
}

function generateAnnotation(changedFiles, files) {
  function findFile(filename) {
    for (const file of files) {
      if (filename === file.filename) return file
    }
    return null
  }

  const annotations = []
  let touchedLines = 0
  changedFiles.forEach(({filename, content}) => {
    original = findFile(filename)
    if (original) {
      diff = structuredPatch(filename, filename, original.content, content)
      diff.hunks.forEach(({oldStart, oldLines}) => {
        const annotation = {
          path: filename,
          start_line: oldStart,
          end_line: oldStart + oldLines,
          annotation_level: 'failure',
          message: `Lines ${oldStart}-${oldStart+oldLines} need formatting.`,
        }
        annotations.push(annotation)
        touchedLines += oldLines
      })
    }
  })

  return {
    annotations,
    lines: touchedLines,
  }
}

module.exports = {
  lint,
  format,
}
