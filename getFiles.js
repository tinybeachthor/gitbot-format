async function getFiles (github, pr) {
  const { pulls, git } = github

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
    promises.push(promise)
  })

  // all file downloads
  return Promise.all(promises)
}
module.exports = getFiles
