const {spawn} = require('child_process')

module.exports = (content, style) => {
  return new Promise((resolve, reject) => {

    const formattedStyle = Buffer.from(style ? style : 'Google')

    // spawn process
    const options = ["-style="+formattedStyle.toString('utf8')]
    const format = spawn('clang-format', options)

    // wait for output
    let output = ""
    format.stdout.on('data', data => {
      output += data
    })

    // check for errors
    format.stderr.on('data', data => {
      reject(data.toString())
    })

    // resolve on close
    format.on('close', code => {
      if (code === 0) {
        resolve(output)
      }
      else {
        reject(code)
      }
    })

    // pipe data
    format.stdin.write(content)
    format.stdin.end()
  })
}
