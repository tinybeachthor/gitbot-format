# gitbot-format - GitHub Action

Keeps your repo tidy by running ```clang-format``` on every PR.

## Setup

Add the following to `.github/workflows/pr.yaml`:

```yaml
name: PR

on:
  pull_request:

jobs:
  checks:
    runs-on: ubuntu-latest
    name: checks
    steps:
    - name: clang-format
      id: clang-format
      uses: WhoMeNope/gitbot-format@releases/v1
      with:
        repo-token: ${{ secrets.GITHUB_TOKEN }}
        config-path: '.clang-format'
```

Enjoy automatic `clang-format` linting.

Optionally, to allow formatting, add `.github/workflows/comment.yaml`:

```yaml
name: Comment

on:
  pull_request:
    types:
    - opened
    - edited
  issue_comment:
    types:
    - created
    - edited

jobs:
  format:
    runs-on: ubuntu-latest
    name: Format
    env:
      TAKE_ACTION: true
    steps:
    - name: Check for trigger word
      uses: khan/pull-request-comment-trigger@1.0.0
      id: trigger
      with:
        trigger: '/format'
        reaction: hooray
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    - name: clang-format
      id: clang-format
      uses: WhoMeNope/gitbot-format@releases/v1
      with:
        repo-token: ${{ secrets.GITHUB_TOKEN }}
        config-path: '.clang-format'
      if: steps.trigger.outputs.triggered == 'true'
```

This will trigger auto-formatting whenever you comment `/format` in a PR.

## Features

### Respects repo stylefile

Just a regular ```.clang-format``` file in the root of the repo.
Checks on the default branch first, PR branch second, and defaults
to ```-style=Google``` if none found.

### Only checks changed files

Only looks on files changed in a PR, so that it does not introduce extra changes
from beyond the scope of the PR.

## FAQ

**Why prefer stylefile from the default branch to feature branch stylefile?**
> Since the goal is to keep the format of the whole codebase consistent,
> preferring the default branch stylefile will enforce the same style on all
> feature branches and make changes to the stylefile propagate instantly
> (no need to rebase every feature branch)

## License

[ISC](LICENSE) © 2020 Martin Toman <whomenope@outlook.com>
