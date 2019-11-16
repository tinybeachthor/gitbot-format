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

async function clangFormat (filename, content, style) {
  const formattedStyle = Buffer.from(style ? style : 'Google')
  const options = [
    "-assume-filename="+filename,
    "-style="+formattedStyle.toString('utf8')
  ]

  // format until file does not change anymore
  let input
  let output = content
  do {
    input = output
    output = await spawnAndPipe(input, options)
  } while (input !== output)

  return output
}

function spawnAndPipe (input, options) {
  const process = spawn('clang-format', options)

  return new Promise((resolve, reject) => {
    // wait for output
    let output = ""
    process.stdout.on('data', data => {
      output += data
    })

    // check for errors
    process.stderr.on('data', data => {
      reject(data.toString())
    })

    // resolve on close
    process.on('close', code => {
      if (code === 0) {
        resolve(output)
      }
      else {
        reject(code)
      }
    })

    // pipe data
    process.stdin.write(input)
    process.stdin.end()
  })
}

