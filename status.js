module.exports = (checks, statusInfo) => {

  const title = statusInfo.name
  let started_at = new Date()

  function queued () {
    return checks.create({
      ...statusInfo,
      status: "queued",
      output: {
        title,
        summary: 'Waiting to format...'
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

  function success () {
    return checks.create({
      ...statusInfo,
      status: "completed",
      started_at,
      completed_at: new Date(),
      conclusion: "success",
      output: {
        title,
        summary: 'Formatted all right!'
      },
    })
  }

  return {
    queued,
    progress,
    success,
  }
}
