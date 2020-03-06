import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import tempWrite from 'temp-write'

import { SpawnOptions } from 'child_process'

// '@@ -6,10 +6,9 @@ int checkEvenOrOdd() {' => {6, 10, 6, 9}
function parsePatchHeader (header: string): types.PatchRange {
  const lineStats = (header.split('@@')[1]).split(' ')
  const originalStats = lineStats[1].substr(1).split(',')
  const editedStats = lineStats[2].substr(1).split(',')

  return {
    oldStart: parseInt(originalStats[0]),
    oldLines: parseInt(originalStats[1]) || 0,
    newStart: parseInt(editedStats[0]),
    newLines: parseInt(editedStats[1]) || 0,
  }
}

async function spawnAndGet (
  command: string,
  args: string[],
  options: SpawnOptions
) : Promise<string> {
  const p = spawn(command, args, options)

  return new Promise((resolve, reject) => {
    // wait for output
    let output = ""
    p.stdout && p.stdout.on('data', data => {
      output += data
    })

    // check for errors
    p.stderr && p.stderr.on('data', data => {
      reject(data.toString())
    })

    // resolve on close
    p.on('close', code => {
      if (code === 0 || code === 1) {
        resolve(output)
      }
      else {
        reject(code)
      }
    })
  })
}

async function generateDiff (edited: types.File, original: types.File) {
  const editedFile = tempWrite.sync(edited.content, path.basename(edited.filename))
  const originalFile = tempWrite.sync(original.content, path.basename(original.filename))

  try {
    const output = await spawnAndGet(
      'git',
      ['diff', '--no-index', '--exit-code', '--unified=1', '--minimal',
        originalFile, editedFile],
      { timeout: 10 * 1000 }
    )

    return output
      .split('\n')
      .filter(line => line.startsWith('@@'))
      .map(parsePatchHeader)
  }
  finally {
    // remove temp files
    fs.unlink(editedFile, (err) => err && console.error(err))
    fs.unlink(originalFile, (err) => err && console.error(err))
  }
}

export default async function generateAnnotations (edited: types.File, original: types.File): Promise<types.Annotations> {
  const hunks = await generateDiff(edited, original)

  return hunks.reduce(({annotations, lines}: types.Annotations, {oldStart, oldLines}: types.PatchRange) => {
    annotations.push({
      path: original.filename,
      start_line: oldStart,
      end_line: oldStart + oldLines,
      annotation_level: 'failure',
      message: `Lines ${oldStart}-${oldStart+oldLines} need formatting.`,
    })
    return {
      annotations,
      lines: lines + oldLines,
    }
  }, {
    annotations: [],
    lines: 0,
  })
}
