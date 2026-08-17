# 2.3.0

- New feature: support for the Android target. Configure the Android SDK, NDK, JDK, and keystore via `gm-options.json` or `--toolchain-options`. Thanks @BenjaminHalko ([#235](https://github.com/YoYoGames/gm-cli/pull/235))
- Fix: The "remove unused assets" setting is now respected. Thanks @BenjaminHalko ([#232](https://github.com/YoYoGames/gm-cli/pull/232))
- Fix: updated the outdated GMRT registry URL. (However, note that there is currently a, temporary, unrelated issue with GMRT 0.21 on MacOS)

# 2.2.0

- New feature: support for building with YYC on Windows. You must specify the 'visualStudioSdk' via `gm-options.json` or `--toolchain-options`. For example in the `gm-options.json` file: `"gms2": { "windows": { "visualStudioSdk": "C:\\Program Files\\Microsoft Visual Studio\\18\\Community\\Common7\\Tools\\VsDevCmd.bat"}}`

# 2.1.0

- New feature: `--config` flag, used to set the project user config.

# 2.0.0

- New feature: support for LTS 2026 and Beta feeds for the GMS2 toolchain.
- This is a major release to ensure everyone without a pinned runtime version get's their cache cleared and downloads the new LTS release.

# 1.4.1

- Fix: Relative project paths are now handled correctly (e.g. `gm-cli run ./some/project.yyp` works as intended)

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
