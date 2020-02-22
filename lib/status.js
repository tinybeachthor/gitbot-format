module.exports = (checks, statusInfo) => {

  const sha = statusInfo.head_sha

  function getForSha(hash) {
    function hash2number(hash) {
      return hash
        .split('')
        .map(c => c.charCodeAt(0))
        .reduce((acc, x) => acc + x, 0)
    }
    return this[hash2number(hash) % this.length]
  }

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

    'https://i.imgur.com/6Ujoypl.jpg',
    'https://i.imgur.com/kSb9HUf.gif',
    'https://i.imgur.com/fS0rtRP.gif',
    'https://i.imgur.com/XCNCgkF.gif',
    'https://i.imgur.com/XmO1n7p.gif',
    'https://i.imgur.com/2g2JcEA.gif',
    'https://i.imgur.com/Q8YhMf8.gif',
    'https://i.imgur.com/rprDnd7.gif',
    'https://i.imgur.com/gfyNHob.gif',

		'https://media.giphy.com/media/gy4PFY2wH94RO/source.gif',
    'https://i0.kym-cdn.com/photos/images/original/001/151/241/bd9.gif',
    'https://i.gifer.com/2HNh.gif',
    'https://66.media.tumblr.com/1a877c907dd213474ca0061caa13fdee/tumblr_mwdenkWwv41qa94xto1_500.gif',
    'https://i.imgur.com/6x7tbsD.gif',
  ]
  successGifs.getForSha = getForSha

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
        annotations: annotations.slice(0, 50), // Limited to 50 at a time
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
          title: `Skipped ${filename}.`,
          summary: `Failed to get or process following file:\n${filename}`,
        },
      })
    }
    else {
      const filenames = skipped.reduce((acc, filename) => `${acc}${filename};`, '')
      return checks.create({
        ...options,
        output: {
          title: `Skipped ${skipped.length} files.`,
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
