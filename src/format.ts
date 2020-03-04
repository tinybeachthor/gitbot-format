import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import tempWrite from 'temp-write'

import { File } from './types.d'

const extensions =
  ['.c', '.h', '.cpp', '.hpp', '.C', '.H', '.cc', '.hh', '.cxx', '.hxx']

export default async ({filename, content}: File, style: string) => {
  if (!extensions.includes(path.extname(filename))) {
    return {filename, content, touched: false}
  }

  const transformed = await clangFormat(filename, content, style)
  return {
    filename,
    content: transformed,
    touched: transformed != content,
  }
}

async function clangFormat (filename: string, content: string, style: string) {
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

    const file = tempWrite.sync(input, path.basename(filename))
    await spawnAndPipe(file, options),
    output = fs.readFileSync(file).toString()

    // remove temp file
    fs.unlink(file, (err) => err && console.error(err))

  } while (input !== output)

  return output
}

function spawnAndPipe (filePath: string, options: string[]) {
  return new Promise((resolve, reject) => {
    const p = spawnSync('clang-format', [...options, filePath], {
      stdio: 'ignore',
      timeout: 60 * 1000,
    })

    p.error ? reject(p.error) : resolve(0)
  })
}

