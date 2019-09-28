const path = require('path')

module.exports = files => {

  const extensions =
    ['.c', '.h', '.cpp', '.hpp', '.C', '.H', '.cc', '.hh', '.cxx', '.hxx']

  let formatted = files

  function format() {
    formatted = files
      .filter(({ filename }) => {
        return extensions.includes(path.extname(filename))
      })
      .map(({ filename, content }) => {
        const transformed = content + "\n"

        return {
          filename,
          content: transformed,
          touched: true,
        }
      })
  }

  function touched() {
    return formatted.filter(({ touched }) => touched)
  }

  return {
    format,
    touched,
  }
}
