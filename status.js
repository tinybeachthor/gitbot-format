module.exports = (checks, statusInfo) => {

  const title = statusInfo.name
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
        title,
        summary: `Error occurred : ${error}`,
      },
    })
  }

  function queued () {
    return checks.create({
      ...statusInfo,
      status: "queued",
      output: {
        title,
        summary: 'Queued...'
      }
    })
  }

  function progress (time) {
    started_at = time

    return checks.create({
      ...statusInfo,
      status: "in_progress",
      started_at,
      output: {
        title,
        summary: 'Formatting...'
      }
    })
  }

  function failure (annotations, lines) {
    return checks.create({
      ...statusInfo,
      status: "completed",
      started_at,
      completed_at: new Date(),
      conclusion: "action_required",
      output: {
        title: `${lines} lines need formatting`,
        summary: `That's some nasty code.\nShowing first 50 formatting issues.`,
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

  function success () {
    return checks.create({
      ...statusInfo,
      status: "completed",
      started_at,
      completed_at: new Date(),
      conclusion: "success",
      output: {
        title,
        summary: 'Formatted all right!',
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
    success,
  }
}
