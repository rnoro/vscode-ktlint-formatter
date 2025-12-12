# Change Log

All notable changes to the "Ktlint Formatter" extension will be documented in this file.

## [0.1.6] - 2025-12-12

### Added

- **Testing Infrastructure**: Implemented Mocha testing framework for automated testing
- **CI/CD Pipeline**: Added GitHub Actions workflow for continuous integration on Windows, Linux, and macOS
- **Test Suite**: Created comprehensive test suite to validate Kotlin code formatting functionality
- **Test Coverage**: Added test case for verifying function signature spacing fixes

### Fixed

- **File Name Validation**: Fixed PascalCase naming validation for temporary files
- **Formatter**: Removed random identifier from temporary file names to maintain original file naming conventions

## [0.1.5] - 2025-11-30

### Improved

- **Windows Support**: Use official `ktlint.bat` wrapper for Windows execution
- **Download Strategy**: Download both `ktlint.bat` and `ktlint` JAR on Windows for proper batch file execution
- **Compatibility**: Follow official ktlint documentation for Windows support

### Fixed

- **Windows Execution**: Fixed potential execution issues by using official batch wrapper instead of direct JAR execution

## [0.1.4] - 2025-11-30

### Added

- **Windows Support**: Added cross-platform support for Windows, Linux, and macOS

### Fixed

- **Path Resolution**: Fixed ktlint path resolution to use consistent approach across all platforms
- **Windows Execution**: Enabled shell option for proper ktlint execution on Windows
- **Download Logic**: Simplified download mechanism to use single ktlint binary for all platforms

## [0.1.3] - 2025-11-23

### Performance

- **Async I/O**: Implemented asynchronous file operations for better editor responsiveness
- **Optimization**: Reduced main thread blocking during formatting

## [0.1.2] - 2025-11-23

### Fixed

- **Critical Formatting Bug**: Fixed `UnknownFormatConversionException` when formatting code
- **Stability**: Changed formatting mechanism to use temporary files instead of stdin to avoid ktlint 1.x bugs

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
