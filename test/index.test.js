const nock = require('nock')

const myProbotApp = require('..')
const { Probot, createProbot } = require('probot')

nock.disableNetConnect()

describe('gitbot-format', () => {
  let probot
  beforeEach(() => {
    probot = createProbot({ id: 1, cert: 'test', githubToken: 'test' })
    probot.load(myProbotApp)
  })

  test('creates a passing check', async () => {
    // Test that we correctly return a test token
    nock('https://api.github.com')
      .post('/app/installations/2/access_tokens')
      .reply(200, { token: 'test' })

    // // Test that a comment is posted
    // nock('https://api.github.com')
    //   .post('/repos/hiimbex/testing-things/issues/1/comments', (body) => {
    //     expect(body).toMatchObject(issueCreatedBody)
    //     return true
    //   })
    //   .reply(200)

    // // Receive a webhook event
    // await probot.receive({ name: 'issues', payload })
  })
})
