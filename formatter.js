const path = require('path')

const clangFormat = require('./clang-format')

const extensions =
  ['.c', '.h', '.cpp', '.hpp', '.C', '.H', '.cc', '.hh', '.cxx', '.hxx']

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

module.exports = async (files, style) => {
  const results = []

  await asyncForEach(
    files
      .filter(({ filename }) => {
        return extensions.includes(path.extname(filename))
      }),
    async function callClangFormat({filename, content}) {
      const result = await clangFormat(filename, content, style)
        .then((transformed) => {
          return {
            filename,
            content: transformed,
            touched: transformed != content,
          }
        })

      results.push(result)
    }
  )

  return results.filter(({touched}) => touched)
}
