import { successGifs, failureGifs } from './gifs'

function getForSha(collection: any[], hash: string) {
  function hash2number(hash: string) {
    return hash
      .split('')
      .map(c => c.charCodeAt(0))
      .reduce((acc, x) => acc + x, 0)
  }
  return collection[hash2number(hash) % collection.length]
}

export default (checks: any, statusInfo: types.CheckrunInfo): types.Checkrun => {

  const sha = statusInfo.head_sha
  let started_at = new Date()

  function error (error: string) {
    return checks.create({
      ...statusInfo,
      status: "completed",
      started_at,
      completed_at: new Date(),
      conclusion: "failure",
      output: {
        title: 'Error',
        summary: `Error occurred : ${error}`,
      },
    })
  }

  function queued () {
    return checks.create({
      ...statusInfo,
      status: "queued",
      output: {
        title: 'Queued...',
        summary: 'Waiting to run',
      },
    })
  }

  function progress (time: Date) {
    started_at = time

    return checks.create({
      ...statusInfo,
      status: "in_progress",
      started_at,
      output: {
        title: 'Formatting...',
        summary: 'Running the job',
      },
    })
  }

  function failure (annotations: types.Annotation[], lines: number, skipped: string[]) {
    const skipped_filenames = skipped.reduce((acc, filename) => `${acc}${filename};`, '')
    const skipped_report = skipped_filenames !== '' ? `\n\nFailed to get or process following files:\n${skipped_filenames}` : ''
    return checks.create({
      ...statusInfo,
      status: "completed",
      started_at,
      completed_at: new Date(),
      conclusion: "action_required",
      output: {
        title: `${lines} lines need formatting`,
        summary: `Showing first 50 formatting issues.` + skipped_report,
        images: [
          {
            alt: 'sad',
            image_url: getForSha(failureGifs, sha),
          },
        ],
        annotations: annotations.slice(0, 50), // Limited to 50 at a time
      },
    })
  }

  function warningSkipped (skipped: string[]) {
    const options = {
      ...statusInfo,
      status: "completed",
      started_at,
      completed_at: new Date(),
      conclusion: "neutral",
    }

    if (skipped.length == 1) {
      const filename = skipped[0]
      return checks.create({
        ...options,
        output: {
          title: `Skipped ${filename}`,
          summary: `Failed to get or process following file:\n${filename}`,
        },
      })
    }
    else {
      const filenames = skipped.reduce((acc, filename) => `${acc}${filename};`, '')
      return checks.create({
        ...options,
        output: {
          title: `Skipped ${skipped.length} files`,
          summary: `Failed to get or process following files:\n${filenames}`,
        },
      })
    }
  }

  function success () {
    return checks.create({
      ...statusInfo,
      status: "completed",
      started_at,
      completed_at: new Date(),
      conclusion: "success",
      output: {
        title: 'Format all right!',
        summary: 'Beautiful code right there!',
        images: [
          {
            alt: 'happy',
            image_url: getForSha(successGifs, sha),
          },
        ],
      },
    })
  }

  return {
    error,

    queued,
    progress,

    failure,
    warningSkipped,
    success,

    getAPI: () => checks,
  }
}
