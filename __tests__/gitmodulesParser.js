const parser = require('gitmodulesParser')

test('parses multiple submodules', () => {
  const gitmodules = `
  [submodule "a"]
  \tpath = a
  \turl = git@github.com:org/repoA.git
  [submodule "dir1/dir2/b"]
  \tpath = dir1/dir2/b
	\turl = git@github.com:org/repoB.git
  `
  const expected = [
    'a',
    'dir1/dir2/b',
  ]

  expect(parser.parsePaths(gitmodules)).toEqual(expected)
})

test('parses empty submodules', () => {
  const gitmodules = ''
  const expected = []

  expect(parser.parsePaths(gitmodules)).toEqual(expected)
})
