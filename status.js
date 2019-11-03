module.exports = (checks, statusInfo) => {

  const sha = statusInfo.head_sha

  const successGifs = [
    'https://imgur.com/xS6ZYWn.gif',
    'https://imgur.com/xAIRmOG.gif',
    'https://imgur.com/5B9jzkX.gif',
    'https://imgur.com/CQoRHRT.gif',
    'https://imgur.com/ZDdXOVR.gif',
    'https://imgur.com/MGWv2GK.gif',
    'https://imgur.com/XbFqF55.gif',
    'https://imgur.com/vWpBm6U.gif',
    'https://imgur.com/ymknBjY.gif',
    'https://imgur.com/MSs0DLT.gif',
    'https://imgur.com/JbrXIMG.gif',
    'https://imgur.com/oJqCQbw.gif',
  ]
  successGifs.getForSha = function getForSha(hash) {
    function hash2number(hash) {
      return hash
        .split('')
        .map(c => c.charCodeAt(0))
        .reduce((acc, x) => acc + x, 0)
    }
    return successGifs[hash2number(hash) % successGifs.length]
  }

  let started_at = new Date()

  function error (error) {
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

  function progress (time) {
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

  function failure (annotations, lines, skipped) {
    const skipped_filenames = skipped.reduce((acc, filename) => `${acc}${filename};`, '')
    const skipped_report = skipped_filenames !== '' ? `\n\nFailed to get/process following files: ${skipped_filenames}` : ''
    return checks.create({
      ...statusInfo,
      status: "completed",
      started_at,
      completed_at: new Date(),
      conclusion: "action_required",
      output: {
        title: `${lines} lines need formatting`,
        summary: `Showing first 50 formatting issues.` + skipped_report,
        annotations: annotations.slice(0, 50), // 50 at a time limit
      },
      actions: [
        {
          label: 'Format!',
          description: 'Format files in this PR.',
          identifier: 'gitbot-format_format',
        },
      ],
    })
  }

  function warningSkipped (skipped) {
    const filenames = skipped.reduce((acc, filename) => `${acc}${filename};`, '')
    return checks.create({
      ...statusInfo,
      status: "completed",
      started_at,
      completed_at: new Date(),
      conclusion: "neutral",
      output: {
        title: `${skipped.length} files skipped.`,
        summary: `Failed to get/process following files:\n${filenames}`,
      },
    })
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
            alt: 'celebration',
            image_url: successGifs.getForSha(sha),
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
  }
}
