const yaml = require('js-yaml')
const { structuredPatch } = require('diff')

async function getStylefile({owner, repo, ref}, repos, info) {
  const stylefileName = '.clang-format'

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

async function getFiles ({pulls, git}, pr) {
  // get PR changed files
  const response = await pulls.listFiles(pr)

  // download all file blobs
  const promises = []
  response.data.forEach(({ filename, sha }) => {
    const promise = git
      .getBlob({
        owner: pr.owner,
        repo: pr.repo,
        file_sha: sha,
      })
      .then(({ data }) => {
        const buffer = Buffer.from(data.content, 'base64')
        const text = buffer.toString('utf8')
        return {
          filename,
          content: text,
        }
      })

    // push promise
    promises.push(promise
      .catch(e => {
        return {
          filename,
          exception: e,
        }
      }))
  })

  // all file downloads
  const finished = await Promise.all(promises)

  const resolved = finished
    .filter(x => !(x instanceof Error))
  const errored = finished
    .filter(x => (x instanceof Error))

  return {
    resolved,
    errored,
  }
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
  getStylefile,
  getFiles,
  generateAnnotation,
}
