function parsePaths (gitmodules: string) {
  return gitmodules
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('path = '))
    .map(l => l.split('path = ')[1])
}

export default {
  parsePaths
}
