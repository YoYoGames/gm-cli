# GameMaker CLI
**The GameMaker command-line interface `gm-cli` is a helpful tool to edit, compile, package, and run your GameMaker projects.**

![Recording of the gm-cli run command](https://raw.githubusercontent.com/YoYoGames/gm-cli/refs/heads/main/recordings/run.gif)

# Usage
> IMPORTANT: You must first install [nodeJS](https://nodejs.org/en) which comes with the tools `npm` and `npx`. 

Run:
```sh
npx @gamemaker/gm-cli@latest --help
```

...or if your prefer to install `gm-cli` globally
```
npm install -g @gamemaker/gm-cli@latest
gm-cli --help
```

GameMaker CLI has many _commands_, to learn more about them, use the `--help` flag. For example, to see how the `compile` command works, run:
```
npx @gamemaker/gm-cli@latest compile --help
```
### Create new projects
Use `gm-cli init` to create a new project, either from a blank game or a template. 
```sh
npx @gamemaker/gm-cli@latest init
```
If you wish, it will also help you setup more advanced feature like:
- GitHub automation pipelines to compile and package your project
- AI agent integration (AGENTS.md, MCP, Claude config)
### Compile, run, and package projects
GameMaker CLI can automatically download the runtime and all other tools needed to compile and run your projects.

Try running one of these commands in a folder with a `.yyp` file:
```sh
npx @gamemaker/gm-cli@latest run
npx @gamemaker/gm-cli@latest compile
npx @gamemaker/gm-cli@latest package
```

Note that there are many options, like `target`, `runtime` and `toolchain` to configure if you wish. Use the `--help` flag for more details. For example:
```
npx @gamemaker/gm-cli@latest compile --runtime=vm --target=operagx --toolchain=gms2@2024.14.3.260
```
### Edit projects without the IDE
Use `gm-cli resourcetool` to programmatically make changes to your project files without having to use the IDE. Try it out inside a project:
```sh
gm-cli resourcetool eval "resource list"
```
There are many ways of using ResourceTool, the most convenient is with an AI agent using the [Model Context Protocol](https://modelcontextprotocol.io/docs/getting-started/intro) `gm-cli resourcetool mcp`. But you can also use it yourself in interactive session `gm-cli resourcetool repl` or as a script. 
### Signing-in
GameMaker CLI automatically gives you a guest license, so there is no need to sign in. But if you prefer to use your own access key from https://gamemaker.io/en/account/access-keys. You may run:
```
npx @gamemaker/gm-cli@latest login <my key>
```

### Query the GameMaker Manual
 The command `gm-cli manual` can be used to _semantically_ search [GameMaker Manual](https://manual.gamemaker.io/monthly/en/). Use the `open` subcommand to open a a web page in your browser. You can also get results in a specific language through `--language`. Try it out:
```sh
gm-cli manual open "sprites" --language=es
```
The `read` subcommand displays an article directly in your terminal, 
```sh
gm-cli manual read "data structures"
```

### Publish to GX.Games
Use `gm-cli gxgames` to publish a game to [gx.games](https://gx.games). Run `gm-cli gxgames --help` for the full list of subcommands.

The flow:

1. **Package** the game as an OperaGX zip:
   ```sh
   npx @gamemaker/gm-cli@latest package --target=operagx --output=game.zip
   ```
2. **Link** the project to a studio and game (opens the browser to sign in on first use):
   ```sh
   npx @gamemaker/gm-cli@latest gxgames link --studioid=<id> --gameid=<id>
   ```
   Omit the flags to pick interactively.
3. **Upload** the zip (prompts for a `X.Y.Z.B` version if `--version` is omitted):
   ```sh
   npx @gamemaker/gm-cli@latest gxgames upload --file=game.zip --version=1.0.0.0
   ```
4. **Set metadata** required for publishing — title (must be unique across GX.Games), description, age rating, platforms, 16:9 cover, and 16:9 screenshot. Cover and graphic must have an **exact** 16:9 aspect ratio (e.g. 1920×1080):
   ```sh
   npx @gamemaker/gm-cli@latest gxgames meta \
     --title="My Game" \
     --description="A short description" \
     --age-rating=EVERYONE \
     --platforms=DESKTOP,MOBILE \
     --cover=cover_1920x1080.png \
     --graphic=screenshot_1920x1080.png
   ```
   Each flag overrides one field; omitted flags keep the current server value.
5. **Publish** to make the game public (opens the published page on success):
   ```sh
   npx @gamemaker/gm-cli@latest gxgames publish
   ```

## Near future
> Note: The GameMaker CLI is made for the community and we welcome your feedback! Please suggest features or tell us about any issues you are having.

**Many features are planned to soon be added to `gm-cli`. These include:**
## More targets
GameMaker CLI will have support to manage more targets.

### A library to make your own tools
`gm-cli` will expose its internals as a TypeScript library that you can use to more easily make your own editor tools. 

### Editor integration
`gm-cli` will support opening projects in the IDE (or your preferred editor) and likely also help you download the IDE itself.
