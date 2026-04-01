# GM-CLI

> GM: unified command-line tool to download and manage runtimes as well as editing, building, and running GameMaker projects.

## Setup (first time)

### Sign in to registry

The GM CLI and parts of the underlying tools are only available internally in the https://gmpm-private.gamemaker.io registry. So start by signing in.

```bash
npm login --registry https://gmpm-private.gamemaker.io --scope @experimental
```

### Get a license

**This won't be needed in the future.** But for now, make sure to set the env variable `GAMEMAKER_LICENSE`. You can fetch a new license by issuing an [access key](https://gamemaker.io/en/account/access-keys) and running:

```bash
npx @experimental/gm@latest login --print <access key>
# then save output to a file and export GAMEMAKER_LICENSE=...
```

Alternatively, running the command without the `--print` flag will save a license file that's automatically picked up by all other gm commands ran from the same directory.

### Specify a prefabs folder

**This won't be needed in the future.** Specify what folder should be used to get prefabs. Assuming you have the IDE installed you can set:

```bash
export GAMEMAKER_PREFABS=/Users/Shared/GameMakerStudio2/Prefabs
```

## Usage

Simply run the command without any arguments for more details. Each subcommand has a `--help` flag that can be used for more details.

```bash
npx @experimental/gm@latest

# Scaffolding a project
npx @experimental/gm@latest init

# building a project
npx @experimental/gm@latest run # assuming you are in the project dir
npx @experimental/gm@latest run /path/to/project.yyp

# Running a ResourceTool shell
npx @experimental/gm@latest edit
# Running ResourceTool as an MCP server
npx @experimental/gm@latest edit --mcp
# Add MCP server to Claude (assuming you are in the project dir)
claude mcp add gamemaker -- npx @experimental/gm@latest edit --mcp
```

## Development

We use pnpm when developing.

```bash
pnpm install
pnpm build
pnpm link
gm
```

## Publish

```
pnpm publish --access restricted
```
