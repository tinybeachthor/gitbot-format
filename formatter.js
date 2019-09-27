module.exports = files => {

  let formatted = files

  function format() {
    formatted = files.map(({ filename, content }) => {
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
