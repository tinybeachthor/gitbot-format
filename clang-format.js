const {spawn} = require('child_process')

module.exports = content => {
  return new Promise((resolve, reject) => {
    // spawn process
    const format = spawn('clang-format', ['-style=LLVM'])

    // pipe data
    format.stdin.write(content)
    format.stdin.end()

    // wait for output
    let output = ""
    format.stdout.on('data', data => {
      output += data
    })

    // check for errors
    format.stderr.on('data', data => {
      reject(data)
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
  })
}
