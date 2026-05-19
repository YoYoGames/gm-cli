# 1.4.1

- Fix: Relative project paths are now handled correctly (e.g. `gm-cli ./some/project.yyp` works as intended)

# 1.4.0

- Fix: `gm-cli package` now works correctly on Linux.
- New feature: Configurable package format for Windows (`zip` or `nsis`), macOS (`zip` or `dmg`), and Linux (`zip` or `appimage`) via `gm-options.json` or `--toolchain-options`. Example: `--toolchain-options '{"windows": {"packageType": "nsis"}}'`.

# 1.3.0

- Fix: Create blank games with latest ResourceTool release
- Fix: Improvements to verbose logging output.
- New feature: Expose OperaGX EmscriptenSDK option. Used when building OperaGX target with YYC.

# 1.2.1

- Correction to changelog.

# 1.2.0

- New feature: Basic support for GMRT toolchain. This is should still be considered experiemental and you may encounter issues.
- New feature: `gm-options.json` file as a convenient way to configure toolchain options and lock what version of the runtime is used.
- New feature: `--toolchain-options` flag for configuring toolchain and target specific options.
- New feature: `gm-cli manual read <query>` can be used to read the GameMaker Manual directly in your terminal.

# 1.1.0

- New feature: `gm-cli gxgames`. Upload and publish your games to gx.games directly from the terminal.
- Rename the _ResourceTool MCP server_ to a more descriptive name (`gamemaker-resource-tool`) when scaffolding AI config files in `gm-cli init`.
