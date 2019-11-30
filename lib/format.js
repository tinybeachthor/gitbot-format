const path = require('path')
const {spawnSync} = require('child_process')
const tempWrite = require('temp-write')
const fs = require('fs')

const extensions =
  ['.c', '.h', '.cpp', '.hpp', '.C', '.H', '.cc', '.hh', '.cxx', '.hxx']

module.exports = async ({filename, content}, style) => {
  if (!extensions.includes(path.extname(filename))) {
    return {filename, content, touched: false}
  }

  const transformed = await clangFormat(filename, content, style)
  return {
    filename,
    content: transformed,
    touched: transformed != content
  }
}

async function clangFormat (filename, content, style) {
  const formattedStyle = Buffer.from(style ? style : 'Google')
  const options = [
    "-style="+formattedStyle.toString('utf8'),
    "-i", // in-place
  ]

  // format until file does not change anymore
  let input
  let output = content
  do {
    input = output

    const file = tempWrite.sync(input, filename)
    await spawnAndPipe(file, options),
    output = fs.readFileSync(file).toString()

    // remove temp file
    fs.unlink(file, (err) => err && console.error(err))

  } while (input !== output)

  return output
}

function spawnAndPipe (filePath, options) {
  return new Promise((resolve, reject) => {
    const p = spawnSync('clang-format', [...options, filePath], {
      stdio: 'ignore',
      timeout: 10 * 1000,
    })

    p.error ? reject(p.error) : resolve(0)
  })
}

