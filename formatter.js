const path = require('path')

const clangFormat = require('./clang-format')

const extensions =
  ['.c', '.h', '.cpp', '.hpp', '.C', '.H', '.cc', '.hh', '.cxx', '.hxx']

module.exports = files => {
  const promises = []

  files
    .filter(({ filename }) => {
      return extensions.includes(path.extname(filename))
    })
    .forEach(({ filename, content }) => {
      const promise = clangFormat(content)
        .then((transformed) => {
          return {
            filename,
            content: transformed,
            touched: true,
          }
        })
      promises.push(promise)
    })

  return Promise.all(promises)
}
