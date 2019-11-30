const { structuredPatch } = require('diff')

async function generateAnnotations({ filename, content }, original) {
  const annotations = []
  let touchedLines = 0

  const diff = structuredPatch(filename, filename, original.content, content)

  diff.hunks.forEach(({oldStart, oldLines}) => {
    const annotation = {
      path: filename,
      start_line: oldStart,
      end_line: oldStart + oldLines,
      annotation_level: 'failure',
      message: `Lines ${oldStart}-${oldStart+oldLines} need formatting.`,
    }
    annotations.push(annotation)
    touchedLines += oldLines
  })

  return {
    annotations,
    lines: touchedLines,
  }
}

module.exports = {
  generateAnnotations,
}
