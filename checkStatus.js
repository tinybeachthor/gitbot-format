function queued (checks, statusInfo) {
  return checks.create({
    ...statusInfo,
    status: "queued",
    output: {
      title: 'gitbot-format',
      summary: 'Waiting to format...'
    }
  })
}

function progress (checks, statusInfo, started_at) {
  return checks.create({
    ...statusInfo,
    status: "in_progress",
    started_at,
    output: {
      title: 'gitbot-format',
      summary: 'Formatting...'
    }
  })
}

function success (checks, statusInfo, started_at) {
  return checks.create({
    ...statusInfo,
    status: "completed",
    started_at,
    completed_at: new Date(),
    conclusion: "success",
    output: {
      title: 'gitbot-format',
      summary: 'Formatted all right!'
    },
  })
}

module.exports = {
  queued,
  progress,
  success,
}
