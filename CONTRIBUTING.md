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

A breaking change to any of these warents increasing the `MAJOR` version of the package. When this occurs GM-CLI will
automatically pruge any outdated caches and update the path in the `$schema` field in `gm-options.json`.

In some scenarios we make use of this cache purging mechanism to make sure users have access to more recent versions
of external tools that GM-CLI depends on. For instance, if we require a new version of Igor for GM-CLI to function, we may bump the
major version.

## Publish

```sh
pnpm publish --access public
```
