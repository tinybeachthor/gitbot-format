const { structuredPatch } = require('diff')

const { spawn } = require('child_process')
const tempWrite = require('temp-write')
const fs = require('fs')

// '@@ -6,10 +6,9 @@ int checkEvenOrOdd() {' => {6, 10, 6, 9}
function parsePatchHeader (header) {
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

function spawnAndGet (command, args, options) {
  const p = spawn(command, args, options)

  return new Promise((resolve, reject) => {
    // wait for output
    let output = ""
    p.stdout.on('data', data => {
      output += data
    })

    // check for errors
    p.stderr.on('data', data => {
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

async function generateDiff (edited, original) {
  const editedFile = tempWrite.sync(edited.content, edited.filename)
  const originalFile = tempWrite.sync(original.content, original.filename)

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

async function generateAnnotations (edited, original) {
  const hunks = await generateDiff(edited, original)

  return hunks.reduce(({annotation, lines}, {oldStart, oldLines}) => {
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
    annotation: [],
    lines: 0,
  })
}

module.exports = {
  generateAnnotations,
}
