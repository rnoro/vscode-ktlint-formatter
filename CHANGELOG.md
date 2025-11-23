# Change Log

All notable changes to the "Ktlint Formatter" extension will be documented in this file.

## [0.1.2] - 2025-11-23

### Fixed

- **Critical Formatting Bug**: Fixed `UnknownFormatConversionException` when formatting code
- **Stability**: Changed formatting mechanism to use temporary files instead of stdin to avoid ktlint 1.x bugs
- **Performance**: Implemented asynchronous file I/O for better responsiveness

## [0.1.1] - 2025-11-23

### Documentation

- Updated README with VS Code Marketplace installation instructions
- Added direct marketplace link for easier installation
- Reorganized installation section to prioritize marketplace installation
- Added CHANGELOG.md to track version history

## [0.1.0] - 2025-11-23

### Initial Release

#### Features

- **Zero Configuration Setup**: No manual ktlint installation required
- **Automatic Ktlint Download**: Downloads ktlint v1.8.0 automatically on first use
- **Native VS Code Integration**: Full support for VS Code's built-in formatting commands
- **Kotlin Language Support**: Format both `.kt` and `.kts` files
- **Format on Save**: Configure automatic formatting when saving files
- **Status Notifications**: Visual feedback for formatting success and errors
- **Output Panel Logging**: Detailed logs available in VS Code's Output panel

#### Requirements

- VS Code 1.85.0 or later
- Java Runtime Environment (JRE) for executing ktlint

#### Technical Details

- Uses ktlint v1.8.0
- Stores ktlint binary in VS Code's global storage
- Follows official Kotlin coding conventions
- Built with TypeScript and webpack

---

## Future Plans

Planned features for upcoming releases:

- Configuration options for ktlint rules
- Support for custom .editorconfig files
- Update ktlint version settings
- Format selection support
- Performance improvements

---

**Note**: Check the [README](README.md) for installation and usage instructions.
