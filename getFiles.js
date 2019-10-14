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
module.exports = getFiles
