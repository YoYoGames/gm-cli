# Development

```sh
pnpm install
pnpm build
pnpm link
```

## Versioning policy

GM-CLI uses [semantic versioning](https://semver.org), i.e. `MAJOR.MINOR.PATCH`. The public API surface consists of,

- Command-line arguments for the program, including their implicit defaults.
- The schema for the `gm-options.json` file.
- The internal structure of the `.gmcache` directory (and the minimum version requirement for external tools like Igor and ProjectTool).

A breaking change to any of these warrants increasing the `MAJOR` version of the package. When this occurs GM-CLI will
automatically purge any outdated caches and update the path in the `$schema` field in `gm-options.json`.

In some scenarios we make use of this cache purging mechanism to make sure users have access to more recent versions
of external tools that GM-CLI depends on. For instance, if we require a new version of Igor for GM-CLI to function, we may bump the
major version.

### Which Igor gets used

The above applies to the standalone Igor that GM-CLI downloads from `gms.yoyogames.com` into `.gmcache/igor`. That copy
is only used to bootstrap: fetching a licence, and listing and installing runtimes. It is versioned independently of the
runtimes and can lag a long way behind them.

Building, running and packaging a project instead use the Igor that ships inside the installed runtime, at
`bin/igor/<platform>/<arch>`, falling back to the downloaded one when the runtime has none (see `findRuntimeIgor`).
Igor and the runner are built and released together, and only that pairing is guaranteed to agree on where a build's
output belongs on disk — mixing them silently produces packages the runner cannot load. This means a fix on the Igor
side reaches users as soon as they install the runtime carrying it, with no `MAJOR` bump needed to purge the cache.

## Publish

```sh
pnpm publish --access public
```
