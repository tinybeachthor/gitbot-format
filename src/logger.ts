import { createLogger, format, transports } from 'winston'

const { combine, timestamp, printf } = format

const logFormat = printf(info => {
  const name = process.env.PROGRAM_ALIAS ? process.env.PROGRAM_ALIAS + ':' : ''
  return `${name}${info.timestamp}:${info.level}: ${info.message}`
})

const logger = createLogger({
  level: process.env.LOG_LEVEL === 'debug' ? 'debug' : 'info',
  format: combine(
    timestamp(),
    logFormat
  ),
  transports: [
    new transports.Console(),
  ],
})

if (process.env.LOG_FILE === 'true') {
  logger.add(
    // - Write all logs error (and below) to `error.log`.
    new transports.File({ filename: 'error.log', level: 'error' })
  )
  logger.add(
    // - Write to all logs with level `info` and below to `combined.log`
    new transports.File({ filename: 'combined.log' })
  )
}

logger.info('logger started up')

export default logger
