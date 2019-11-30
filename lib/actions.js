const logger = require('./logger')

const formatFile = require('./format')
const { getStylefile, getPRFileList, getFile } = require('./hub')
const { generateAnnotations } = require('./diff')

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function format(
  {owner, repo, pull_number, sha, ref},
  {git, pulls, repos},
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
  pushed_blobs = []
  await asyncForEach(pr_filenames, async ({filename, sha}) => {
    info(`Processing ${filename}`)

    try {
      // Get file
      const file = await getFile(git, {owner, repo, filename, sha})
      if (file.exception || !file.content)
        throw Error()

      // Format file
      const transformed = await formatFile(file, style)
      if (!transformed)
        throw Error()
      if (!transformed.touched)
        return

      // Push blob
      const blob = await git
        .createBlob({
          owner,
          repo,
          content: transformed.content,
          encoding: "utf-8",
        })
        .then(({data}) => {
          return { sha: data.sha, filename }
        })
        .catch((err) => err)
      if (blob instanceof Error) {
        error(`Error pushing blob for ${filename}`)
        skipped_filenames.push(filename)
        return
      }
      info(`Created blob for: ${filename}`)
      pushed_blobs.push(blob)
    }
    catch {
      error(`Error transforming ${filename}`)
      skipped_filenames.push(filename)
      return
    }
  })
  const filenamesErrored =
    skipped_filenames.reduce((acc, filename) => `${acc}${filename};`, '')
  filenamesErrored.length && info(`Couldn't get PR files : ${filenamesErrored}`)

  // create tree
  const tree = []
  pushed_blobs.forEach(({ sha, filename }) => {
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

  // Completed
  if (skipped_filenames.length > 0) {
    await status.warningSkipped(skipped_filenames)
  }
  else {
    await status.success()
  }
  info('Completed')
}

async function lint(
  {owner, repo, pull_number, sha, ref},
  {git, pulls, repos},
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
    const file = await getFile(git, {owner, repo, filename, sha})
    if (file.exception || !file.content) {
      error(`Error getting ${filename}`)
      skipped_filenames.push(filename)
      return
    }

    // Format file
    try {
      const transformed = await formatFile(file, style)
      if (!transformed)
        throw Error()
      if (!transformed.touched)
        return

      // Generate annotations
      const file_annotations = await generateAnnotations(transformed, file)

      touched_lines = Number(file_annotations.lines) + Number(touched_lines)
      annotations = annotations.concat(file_annotations.annotations)
    }
    catch {
      error(`Error transforming ${filename}`)
      skipped_filenames.push(filename)
    }
  })
  const filenamesErrored =
    skipped_filenames.reduce((acc, filename) => `${acc}${filename};`, '')
  filenamesErrored.length && info(`Couldn't get PR files : ${filenamesErrored}`)

  // If files touched -> check status annotations
  if (touched_lines > 0 || annotations.length > 0) {
    info(`Touched ${touched_lines} lines`)
    await status.failure(annotations, touched_lines, skipped_filenames)
  }
  else if (skipped_filenames.length > 0) {
    info (`Skipped ${skipped_filenames.length} files`)
    await status.warningSkipped(skipped_filenames)
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
