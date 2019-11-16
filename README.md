# gitbot-format
A GitHub App using the [Probot](https://github.com/probot/probot) framework

Keeps your repos tidy by running ```clang-format``` on every PR.

[Install to your repo!](https://github.com/apps/gitbot-format)

## Features
### Respects repo stylefile
Just a regular ```.clang-format``` file in the root of the repo.
Looks on the default branch first, PR branch second, and lastly defaults
to ```-style=Google```.
### Zero setup
No setup neccessary, just install in GitHub and enjoy.
### Fully stateless
On every restart it rechecks all open PRs in installed repos.
Making it easy to restart/upgrade/migrate/manage the deployment.

## FAQ
### Why prefer stylefile from the default branch to feature branch stylefile.
> Since the goal is to keep the format of the whole codebase consistent,
> prefering the default branch stylefile will enforce the same style on all
> feature branches and make changes to the stylefile propagate instantly
> (no need to rebase every feature branch)

## Changelog
|version|changes|
|---|---|
|0.5.2|Fix non-final formatting, improve skipped files display in checks|
|0.5.1|Paginate app's installations, paginate repo's PRs|
|0.5.0|Stream process PR files to reduce memory usage|
|---|---|
|0.4.0|Page over PR files, handle check reruns, handle getFile failure, sync calls to clang-format, expand logging|
|---|---|
|0.3.2|Improve status check (line count, action required). Annotations limit quickfix.|
|0.3.1|Pass -assume-filename to clang-format|
|0.3.0|Format on action, lint by default|
|---|---|
|0.2.3|Set queued status as soon as possible|
|0.2.2|Use .clang-format from default branch first|
|0.2.1|Fix .clang-format values passing to clang-format process|
|0.2.0|Respect repo .clang-format|
|---|---|
|0.1.0|MVP|

## License
[ISC](LICENSE) © 2019 Martin Toman <whomenope@outlook.com>

