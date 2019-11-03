const path = require('path')
const {spawn} = require('child_process')

const extensions =
  ['.c', '.h', '.cpp', '.hpp', '.C', '.H', '.cc', '.hh', '.cxx', '.hxx']

module.exports = async ({filename, content}, style) => {
  if (!extensions.includes(path.extname(filename))) {
    return {filename, content, touched: false}
  }

  const transformed = await clangFormat(filename, content, style)
  return {filename, content: transformed, touched: transformed != content}
}

function clangFormat (filename, content, style) {
  return new Promise((resolve, reject) => {

    const formattedStyle = Buffer.from(style ? style : 'Google')

    // spawn process
    const options = [
      "-assume-filename="+filename,
      "-style="+formattedStyle.toString('utf8')
    ]
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
