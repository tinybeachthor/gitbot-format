import winston from 'winston'

const { combine, timestamp, printf } = winston.format

winston.configure({
  level: process.env.LOG_LEVEL === 'debug' ? 'debug' : 'info',
  format: combine(
    timestamp(),
    printf(info => {
      const name = process.env.PROGRAM_ALIAS ? process.env.PROGRAM_ALIAS + ':' : ''
      return `${name}${info.timestamp}:${info.level}: ${info.message}`
    })
  ),
  transports: [
    new winston.transports.Console(),
  ],
})

if (process.env.LOG_FILE === 'true') {
  winston.add(
    // - Write all logs error (and below) to `error.log`.
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  )
  winston.add(
    // - Write to all logs with level `info` and below to `combined.log`
    new winston.transports.File({ filename: 'combined.log' })
  )
}

winston.info('logger started up')

export default winston
