import formatFile from './format'
import { getGitmodules, getStylefile, getPRFileList, getFile } from './hub'
import generateAnnotations from './diff'
import Status from './status'

async function asyncForEach (
  array: any[],
  callback: (elem: any, index: number, array: any[]) => Promise<void>
) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export async function format (
  {owner, repo, pull_number, sha, ref}: types.PullRequestInfo,
  {git, pulls, repos, checks}: any
) {
  console.info('Running')

  // Check if exists and get /.clang-format
  const style = await getStylefile({owner, repo, ref}, repos, console.info)

  // Check if exists and get /.gitmodules paths
  const gitmodules = await getGitmodules({owner, repo, ref}, repos, console.info)

  // Get PR file list
  const pr_filenames = await getPRFileList(pulls, {owner, repo, ref, pull_number})
  const filenames = pr_filenames.reduce((acc, {filename}) => `${acc}${filename};`, '')
  console.info(`Got PR's changed files : ${filenames}`)

  // Process files
  let skipped_filenames: string[] = []
  let pushed_blobs: any[] = []
  await asyncForEach(pr_filenames, async ({filename, sha}) => {
    console.info(`Processing ${filename}`)

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
        .then(({data}: any) => {
          return { sha: data.sha, filename }
        })
        .catch((err: Error) => err)
      if (blob instanceof Error) {
        console.error(`Error pushing blob for ${filename}`)
        skipped_filenames.push(filename)
        return
      }
      console.info(`Created blob for: ${filename}`)
      pushed_blobs.push(blob)
    }
    catch (err) {
      if (err)
        console.error(`Error transforming ${filename} : ${err}`)
      else
        console.error(`Error transforming ${filename}`)
      skipped_filenames.push(filename)
    }
  })

  // filter out gitmodules paths from skipped_filenames
  skipped_filenames = skipped_filenames.filter(f => !gitmodules.includes(f))

  // serialize skipped_filenames for printing
  const filenamesErrored =
    skipped_filenames.reduce((acc, filename) => `${acc}${filename};`, '')
  filenamesErrored.length && console.info(`Couldn't get PR files : ${filenamesErrored}`)

  // create tree
  const tree: any[] = []
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
  console.info('Created tree')

  // create commit
  const commitResponse = await git.createCommit({
    owner,
    repo,
    message: 'gitbot-format: automated code format',
    tree: treeResponse.data.sha,
    parents: [sha],
  })
  console.info('Created commit')

  // update branch reference
  await git.updateRef({
    owner,
    repo,
    ref: `heads/${ref}`,
    sha: commitResponse.data.sha,
    force: false,
  })
  console.info('Updated ref')

  // Setup PR status check for new commit
  const status = Status(checks, {
    owner,
    repo,
    name: 'clang-format',
    head_sha: commitResponse.data.sha,
  })

  // Completed
  if (skipped_filenames.length > 0) {
    await status.warningSkipped(skipped_filenames)
  }
  else {
    await status.success()
  }
  console.info('Completed')
}

export async function lint(
  {owner, repo, pull_number, sha, ref}: types.PullRequestInfo,
  {git, pulls, repos}: any,
  status: types.Checkrun
) {
  console.info('Running')

  // Check if exists and get /.clang-format
  const style = await getStylefile({owner, repo, ref}, repos, console.info)

  // Check if exists and get /.gitmodules paths
  const gitmodules = await getGitmodules({owner, repo, ref}, repos, console.info)

  // Get PR file list
  const pr_filenames = await getPRFileList(pulls, {owner, repo, ref, pull_number})
  const filenames = pr_filenames.reduce((acc, {filename}) => `${acc}${filename};`, '')
  console.info(`Got PR's changed files : ${filenames}`)

  // Process files
  let skipped_filenames: string[] = []
  let touched_lines = 0
  let output_annotations: types.Annotation[] = []
  await asyncForEach(pr_filenames, async ({filename, sha}) => {
    console.info(`Processing ${filename}`)

    // Get file
    const file = await getFile(git, {owner, repo, filename, sha})
    if (file.exception || !file.content) {
      console.error(`Error getting ${filename}`)
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
      output_annotations = output_annotations.concat(file_annotations.annotations)
    }
    catch (err) {
      if (err)
        console.error(`Error transforming ${filename} : ${err}`)
      else
        console.error(`Error transforming ${filename}`)
      skipped_filenames.push(filename)
    }
  })

  // filter out gitmodules paths from skipped_filenames
  skipped_filenames = skipped_filenames.filter(f => !gitmodules.includes(f))

  // serialize skipped_filenames for printing
  const filenamesErrored =
    skipped_filenames.reduce((acc, filename) => `${acc}${filename};`, '')
  filenamesErrored.length && console.info(`Couldn't get PR files : ${filenamesErrored}`)

  // If files touched -> check status annotations
  if (touched_lines > 0 || output_annotations.length > 0) {
    console.info(`Touched ${touched_lines} lines`)
    await status.failure(output_annotations, touched_lines, skipped_filenames)
  }
  else if (skipped_filenames.length > 0) {
    console.info (`Skipped ${skipped_filenames.length} files`)
    await status.warningSkipped(skipped_filenames)
  }
  else {
    console.info('No files touched')
    await status.success()
  }
  console.info('Completed')
}
