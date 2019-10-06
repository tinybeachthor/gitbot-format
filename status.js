module.exports = (checks, statusInfo) => {

  const title = statusInfo.name
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
            image_url: 'https://i.imgur.com/xS6ZYWn.gif',
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
