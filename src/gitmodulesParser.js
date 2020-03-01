function parsePaths (gitmodules) {
  return gitmodules
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('path = '))
    .map(l => l.split('path = ')[1])
}

module.exports = {
  parsePaths,
}
