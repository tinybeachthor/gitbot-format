# gitbot-format

GitHub Action

Keeps your repos tidy by running ```clang-format``` on every PR.

## Features

### Respects repo stylefile

Just a regular ```.clang-format``` file in the root of the repo.
Looks on the default branch first, PR branch second, and lastly defaults
to ```-style=Google```.

### Zero setup

No setup necessary, just install in GitHub and enjoy.

### Fully stateless

On every restart it rechecks all open PRs in installed repos.
Making it easy to restart/upgrade/migrate/manage the deployment.

## FAQ

**Why prefer stylefile from the default branch to feature branch stylefile?**
> Since the goal is to keep the format of the whole codebase consistent,
> preferring the default branch stylefile will enforce the same style on all
> feature branches and make changes to the stylefile propagate instantly
> (no need to rebase every feature branch)

## License

[ISC](LICENSE) © 2020 Martin Toman <whomenope@outlook.com>
