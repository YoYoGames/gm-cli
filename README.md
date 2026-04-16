# GM-CLI

> GM: unified command-line tool to download and manage runtimes as well as editing, building, and running GameMaker projects.

## Setup (first time)

### Sign in to registry

The GM CLI and parts of the underlying tools are only available internally in the https://gmpm-private.gamemaker.io registry. So start by signing in.

```bash
npm login --registry https://gmpm-private.gamemaker.io --scope @gamemaker
```

### Specify a prefabs folder

**This won't be needed in the future.** Specify what folder should be used to get prefabs. Assuming you have the IDE installed you can set:

```bash
export GAMEMAKER_PREFABS=/Users/Shared/GameMakerStudio2/Prefabs
```

## Usage

Simply run the command without any arguments for more details. Each subcommand has a `--help` flag that can be used for more details.

```bash
npx @gamemaker/gm-cli@latest

# Scaffolding a project
npx @gamemaker/gm-cli@latest init

# building a project
npx @gamemaker/gm-cli@latest run # assuming you are in the project dir
npx @gamemaker/gm-cli@latest run /path/to/project.yyp

# Running a ResourceTool REPL
npx @gamemaker/gm-cli@latest resourcetool
# Running ResourceTool as an MCP server
npx @gamemaker/gm-cli@latest resourcetool mcp
# Add MCP server to Claude (assuming you are in the project dir)
claude mcp add gamemaker -- npx @gamemaker/gm-cli@latest resourcetool mcp
```

## Development

We use pnpm when developing.

```bash
pnpm install
pnpm build
pnpm link
gm-cli
```

## Publish

```
pnpm publish --access restricted
```
