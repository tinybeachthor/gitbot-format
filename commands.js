class Command {
  constructor (name, callback) {
    this.name = name
    this.callback = callback
  }

  get matcher () {
    return /^\/([\w]+)\b *(.*)?$/m
  }

  listener (context) {
    const { comment, pull_request: pr } = context.payload

    const command = (comment || pr).body.match(this.matcher)

    if (command && this.name === command[1]) {
      return this.callback(context, { name: command[1], arguments: command[2] })
    }
  }
}

function pr_comment (bot, command_string, callback) => {
  const command = new Command(command_string, callback)
  const events = ['issue_comment.created', 'pull_request.opened']
  bot.on(events, command.listener.bind(command))
}

module.exports = {
  pr: pr_comment,
}
