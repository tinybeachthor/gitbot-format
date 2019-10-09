module.exports = (checks, statusInfo) => {

  const title = statusInfo.name
  const sha = statusInfo.head_sha

  const successGifs = [
    'i.imgur.com/xS6ZYWn.gif',
    'i.imgur.com/xAIRmOG.gif',
    'i.imgur.com/5B9jzkX.gif',
    'i.imgur.com/CQoRHRT.gif',
    'i.imgur.com/ZDdXOVR.gif',
    'i.imgur.com/MGWv2GK.gif',
    'i.imgur.com/XbFqF55.gif',
    'i.imgur.com/vWpBm6U.gif',
    'i.imgur.com/ymknBjY.gif',
    'i.imgur.com/MSs0DLT.gif',
    'i.imgur.com/JbrXIMG.gif',
    'i.imgur.com/oJqCQbw.gif',
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

  function error (annotations) {
    return checks.create({
      ...statusInfo,
      status: "completed",
      started_at,
      completed_at: new Date(),
      conclusion: "failure",
      output: {
        title,
        summary: `That's some nasty code.`,
        annotations,
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
    queued,
    progress,
    error,
    success,
  }
}
