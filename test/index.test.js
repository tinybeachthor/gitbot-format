const nock = require('nock')

const myProbotApp = require('..')
const { Probot, createProbot } = require('probot')

const payload = require('./fixtures/pull_request.opened.json')

nock.disableNetConnect()

describe('gitbot-format', () => {
  process.env.NO_RERUN_ON_RESTART = 'true'

  let probot
  beforeEach(() => {
    probot = createProbot({ id: 1, cert: 'test', githubToken: 'test' })
    probot.load(myProbotApp)

  })

  test('Format an opened PR', async () => {
    nock('https://api.github.com')
      .log(console.log)

    // Test that we correctly return a test token
    nock('https://api.github.com')
      .post('/app/installations/2/access_tokens')
      .reply(200, { token: 'test' })

    // 
    nock('https://api.github.com')
      .post('/repos/org-name/check-runs')
      .reply()

    // Invoke bot
    await probot.receive({name: 'pull_request', payload})
  })
})
