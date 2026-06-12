# BackroomArchives

**[English](README.en.md) | 中文**

> **Table of Contents**
>
> - [I. Project Introduction](#i-project-introduction)
> - [II. Features](#ii-features)
> - [III. Dependencies](#iii-dependencies)
> - [IV. Quick Start](#iv-quick-start)
> - [V. Automated Builds](#v-automated-builds)
> - [VI. Usage Guide](#vi-usage-guide)
> - [VII. Project Structure](#vii-project-structure)
> - [VIII. Screenshots](#viii-screenshots)
> - [IX. Coding Style](#ix-coding-style)
> - [X. FAQ](#x-faq)
> - [XI. Contributing Guide](#xi-contributing-guide)
> - [XII. License](#xii-license)
> - [XIII. Contact](#xiii-contact)

A **modular, plug-in based Backrooms-themed text game**.

A Qt-based text game written in C++20.
The core provides only the basic framework, plugin loading, and main game loop; all levels, BUFFs, text, configuration, etc., are dynamically supplied by **Archive plugins**.
Supports multiple archive versions (e.g., Wikidot, Fandom, etc.), each packaged independently and switchable at runtime.

> 👉 Want to develop an archive plugin? Check [FAQ - Plugin Development](#faq---plugin-development)

Current version: `v0.1.0`

> See [Changelog](CHANGELOG.md) for details.

---

## I. Project Introduction

**BackroomArchives** is a text game inspired by the Backrooms setting. Unlike traditional single games, all content – levels, rules, BUFFs, texts – exist as **plugins** stored under different "archive versions" (e.g., the Wikidot community Backrooms archive, Fandom archive, etc.). The core only provides:

- Basic content and resource loading framework
- Cross-platform dynamic library loading (Windows `.dll`, Linux `.so`, macOS `.dylib`)
- Plugin interfaces (`ILevel`, `IBuff`, `ArchiveCore`)
- Main game loop (turn-based or real-time, defined by plugins)
- Lightweight graphical UI (for displaying text, buttons, choice lists, etc.; console is reserved for logs)
- Simple configuration management (player base attributes, language, etc.)
- Logging system

Each archive version is completely independent, containing its own **core plugin** (manages global rules) and **level plugins** (specific level logic). After downloading the corresponding complete package, players can explore all implemented levels under that version. New levels or entirely new archive versions can be added later without modifying the core.

> **Current status**: Basic framework under construction.

---

## II. Features

- **Pure C++20 implementation**, cross-platform (Windows / macOS / Linux)
- **Lightweight graphical UI**: console only for logs, interactions via window controls
- **Plugin-based level system**: each level compiled as an independent dynamic library, stored together with its private resources (texts, config, images, etc.) in the same directory
- **Separated archive versions**: data and logic from different Backrooms wikis (Wikidot, Fandom, etc.) are completely isolated, can be packaged and released independently
- **Dynamic loading mechanism**: core automatically scans version directories under `archives/`, lets user choose at runtime or specify via configuration
- **Core plugin support**: each archive version can provide a core plugin (e.g., `wikidot_core`) for global BUFF management, cross‑level data, entry/exit rules, etc.
- **JSON-based configuration & text**: uses `nlohmann/json` for parsing, supports multi‑language texts (per level or global)
- **Componentised packaging**: uses CPack to generate `core-only` package (core only) and complete packages (core + specified archive version)
- **Automated CI**: GitHub Actions automatically builds multi‑platform, multi‑archive versions and publishes them to Releases
- **Hardware‑accelerated rendering**: In Release mode, QtWebEngine uses GPU acceleration (OpenGL + WebGL) for smooth animations. Debug mode falls back to software rendering (slower, intended for debugging only).
- **C++/JavaScript bidirectional communication**: Implemented efficient communication between the game core and the frontend page based on Qt WebChannel.

---

## III. Dependencies

### 1. System Dependencies

- **C++ Compiler**: with C++20 support (GCC 11+, Clang 14+, MSVC 2022)
- **CMake**: 3.16 or higher
- **Qt**: 5.15 or 6.x (Core, Gui, Widgets).
  this project uses `WebEngineCore` and `WebEngineWidgets`, make sure your Qt installation includes the `WebEngine` module together with its dependencies (`WebChannel`, `Positioning`, etc.).
  Qt 6.x is recommended; use the Qt Maintenance Tool to select all `WebEngine`-related components.
- **Dynamic linker / loader**: platform native (Windows `LoadLibrary`, Linux/macOS `dlopen`)

> Qt 6.x is recommended; CMake will auto-detect and configure it.
> VS2022/2026 (MSVC) is recommended for Windows development; use GCC or Clang on Linux/macOS.

### 2. Third-party libraries

- **[nlohmann/json](https://github.com/nlohmann/json)** (version 3.12.0)
  Used for JSON parsing. CMake automatically downloads the single-header file from GitHub during configuration.

- **[DynamicTextEngine](https://github.com/CrimsonSeraph/WebUtils/tree/main/DynamicTextEngine)** (CSS/JS)
  Used to enhance dynamic text effects in the web interface. CMake automatically downloads `DynamicTextEngine.js` into the `pages/extensions/` directory during configuration.

### 3. Runtime Dependencies

- None. All archive plugins are dynamic libraries loaded at runtime by the core.

---

## IV. Quick Start

### 1. Get the source code

```bash
git clone https://github.com/CrimsonSeraph/BackroomArchives.git
cd BackroomArchives
```

### 2. Configure CMake (using wikidot archive version as an example)

```bash
cmake -B build -DCMAKE_BUILD_TYPE=Release -DARCHIVE_VERSION=wikidot -DBUILD_ARCHIVES=ON
```

- `ARCHIVE_VERSION`: choose which archive version to build (subdirectory under `archives/`)
- `BUILD_ARCHIVES`: set to `ON` to build archive plugins; set to `OFF` if you only need the core
- For Qt6, CMake usually finds it automatically; if using Qt5, ensure the `Qt5` package is available.

> 💡 During CMake configuration, `json.hpp` (for JSON parsing) and the `DynamicTextEngine` CSS/JS files (for web extensions) are automatically downloaded. No manual download is needed.

> 👉 Configuration or build failure? See [FAQ - Compilation & Runtime](#faq---compilation--runtime)

### 3. Build

```bash
cmake --build build --config Release
```

> ⚠️ **Performance note**: Always build in **Release** mode for normal gameplay.
> In Debug mode, QtWebEngine's hardware acceleration (2D canvas & WebGL) is **disabled** by default, causing sluggish animations and low frame rates.
> If you must run Debug builds, expect poor performance. Future updates may add automatic fallback (e.g., disabling certain animations).

### 4. Install to a temporary directory (to inspect results)

```bash
cmake --install build --prefix install_full
```

See [Project Structure](#vii-project-structure) for the installed directory layout.

### 5. Run

```bash
# Windows
./install_full/BackroomArchives.exe

# Linux / macOS
./install_full/BackroomArchives
```

The program will scan for available archive versions under `install_full/archives/`, prompt the user to select one (if only one exists it loads it automatically), and then enter the main game loop.

### 6. Package (create distributable packages)

```bash
cpack --config build/CPackConfig.cmake -B package -G ZIP
```

The generated complete packages are located in the `package/` directory, named like `BackroomArchives-wikidot-Windows.zip`.

---

## V. Automated Builds

This project uses GitHub Actions for continuous integration and delivery. The configuration files are in `.github/workflows/`:

- **`build.yml`**: On push of a tag starting with `v` (e.g., `v0.1.0`) or manual trigger, builds on Ubuntu, Windows, and macOS for each archive version (e.g., `wikidot`, `fandom` – adjust the matrix as needed), then installs, packages, and uploads artifacts.
- **`release.yml`**: After the previous workflow completes successfully, downloads all artifacts, extracts the release notes for the corresponding version from `CHANGELOG.md`, creates a GitHub Release and attaches all packages.

You can modify the `matrix.archive` list in `build.yml` according to the archive versions you actually support.

---

## VI. Usage Guide

### 1. Archive version selection

When the game starts, it scans all subdirectories under `archives/` – each subdirectory is considered an archive version (e.g., `wikidot`, `fandom`). If no configuration file records the previously selected version, the program lists all available versions and asks the user to enter a number. After selection, the archive's core plugin (if present) is loaded, then all level directories under that version are scanned and each level's plugin is loaded.

Users can fix the default version by setting the `"active_archive"` field in the core configuration file `config/game.json` to avoid manual selection each time.

### 2. Archive version structure (using `wikidot` as example)

```
archives/wikidot/
├── wikidot_core.dll      # Archive core plugin (optional, compiled from core.cpp)
├── version.json          # Archive metadata (name, description, version, etc.)
├── pages/                # Archive common pages (multi‑language)
│   ├── en/
│   └── zh/
├── config/               # Archive common config (global rules, BUFF definitions, etc.)
├── level-0/              # Level directory (name can be customised, but level- prefix recommended)
│   ├── level-0.dll       # Level plugin (compiled from level-0.cpp)
│   └── level_text.json   # Private resources for this level
├── level-1/
└── ...
```

### 3. Writing a level plugin

Each level directory must contain a `.cpp` source file with the same name as the directory, implementing the following exported functions (use `extern "C"` to avoid name mangling):

```cpp
#include "plugin_api/ILevel.h"

extern "C" ILevel* create_level() {
    return new MyLevel();
}

extern "C" void destroy_level(ILevel* p) {
    delete p;
}
```

Where `ILevel` is a pure virtual class defined in `include/plugin_api/ILevel.h`:

```cpp
class ILevel {
public:
    virtual ~ILevel() = default;
    virtual std::string get_name() const = 0;
    virtual void on_enter(GameContext& ctx) = 0;
    virtual void on_tick(GameContext& ctx) = 0;
    virtual void on_exit(GameContext& ctx) = 0;
};
```

`GameContext` provides access to player attributes, logging, global state, etc.

### 4. Archive core plugin

If an archive requires global management (e.g., cross‑level BUFFs, automatic unloading rules, unified entry logic), you can provide `core.cpp` in the archive root, compiled into `${ARCHIVE_VERSION}_core` plugin. The core plugin must implement the `ArchiveCore` interface (defined in `plugin_api/ArchiveCore.h`) and return an instance in the exported function.

When loading an archive version, the main program will first load this core plugin and call its initialisation method.

### 5. Configuration files

The system uses two configuration files, ordered by priority from low to high:

- `main.json`: main config, priority 0
- `user.json`: user config, priority 1

Higher priority config values override same‑path values from lower priority configs.
**Note:** Even with override logic, it is still not recommended to define identical properties in different config files.
The `__priority` field in the config files defines the priority and must not be deleted.

> If a config file is missing, defaults will be loaded from `DefaultConfigs.cpp`, and the missing config file will be auto‑generated at runtime.

> 👉 Configuration issues? See [FAQ - Configuration Issues](#faq---configuration-issues)

<details>
<summary><b>`game.json` example:</b></summary>

```json
{}
```

</details>

**Note:** The `"version"` and `"BackroomArchives"` fields are mandatory. Their content can be anything, but **do not delete or modify** these fields.

Archive common configuration files are located under `archives/wikidot/config/`; their specific content is defined by the archive core plugin.

### 6. Multi‑language texts

- **Global texts**: placed under `pages/{lang}/`, read by the core (e.g., welcome message, error prompts, etc.)
- **Archive common texts**: placed under `archives/wikidot/pages/{lang}/`, loaded by the archive core plugin
- **Level private texts**: placed inside the level directory (e.g., `level-0/description.json`), read by the level plugin itself

### 7. Logging

The logging system provides macros `LOG_DEBUG`, `LOG_INFO`, `LOG_WARN`, `LOG_ERROR`, which can output to the console and to a file (if enabled). The log level can be adjusted in the core configuration.

---

## VII. Project Structure

<details>
<summary> Click to expand directory tree </summary>

```
BackroomArchives/
├── .github/                            # GitHub configuration directory
│   └── workflows/                      # CI/CD workflows
│       ├── build.yml                   # Build and test workflow
│       └── release.yml                 # Release workflow
├── archives/                           # Archive versions directory
│   ├── wikidot/                        # Wikidot archive version
│   │   ├── assets/                     # Global static assets (e.g., global images)
│   │   ├── config/                     # Global configuration files (e.g., global BUFF definitions)
│   │   ├── level-0/                    # Level-0 directory
│   │   ├── ......                      # Other level directories
│   │   ├── pages/                      # Global pages (multi-language)
│   │   ├── CMakeLists.txt              # Build script for the Wikidot archive version
│   │   ├── core.cpp                    # Core plugin source file for Wikidot archive
│   │   ├── core.h                      # Core plugin header file for Wikidot archive
│   │   ├── README.md                   # Wikidot archive documentation
│   │   └── version.json                # Archive metadata
│   └── README.md                       # Archives directory documentation
├── assets/                             # Static assets (images, etc.)
│   └── README.md                       # Assets directory documentation
├── config/                             # Default configuration directory
│   ├── main.json                       # Main configuration file
│   ├── README.md                       # Config directory documentation
│   └── user.json                       # User configuration file
├── include/                            # Public header files
│   ├── plugin_api/                     # Plugin interface headers
│   │   └── README.md                   # Plugin_api directory documentation
│   ├── AppConfig.h                     # Main configuration system interface
│   ├── AppConfig_impl.hpp              # Configuration system template implementation
│   ├── AppConfig_utils.hpp             # Configuration helper utilities
│   ├── BackroomArchives.h              # Core archive management module header
│   ├── ConfigManager.h                 # Single configuration file manager
│   ├── ConfigManager_impl.hpp          # ConfigManager template implementation
│   ├── ConfigStructs.h                 # Configuration data structures
│   ├── Console.h                       # Console management
│   ├── DebugLog.h                      # Logging system
│   ├── DebugLog_utils.hpp              # Logging helper utilities
│   ├── DefaultConfigs.h                # Default configuration factory
│   ├── GameStateBridge.h               # Game state bridge class (C++/JS communication)
│   ├── InputHandlerBridge.h            # Input handler bridge class (C++/JS communication)
│   ├── JsConsoleBridge.h               # JavaScript console bridge class (C++/JS communication)
│   ├── MultiConfigManager.h            # Multi-configuration manager
│   ├── MultiConfigManager_impl.hpp     # MultiConfigManager template implementation
│   └── README.md                       # Include directory documentation
├── licenses/                           # Third-party license files
│   └── LICENSE.MIT.txt                 # MIT license for nlohmann/json
├── pages/                              # Page text resource files (multi-language)
│   ├── backrooms-sdk.js                # JavaScript file for the web interface, providing communication bridges and utility functions
│   ├── index.html                      # Home page
│   ├── README.md                       # Pages directory documentation
│   ├── script.js                       # Page script file
│   └── style.css                       # Page style file
├── screenshot/                         # Screenshot resource files
│   └── README.md                       # Screenshot directory documentation
├── src/                                # C++ source files
│   ├── AppConfig.cpp                   # Configuration system implementation
│   ├── BackroomArchives.cpp            # Core archive management module implementation
│   ├── ConfigManager.cpp               # Single configuration manager implementation
│   ├── ConfigStructs.cpp               # Configuration structures implementation
│   ├── Console.cpp                     # Console management implementation
│   ├── DebugLog.cpp                    # Logging system implementation
│   ├── DefaultConfigs.cpp              # Default configuration factory implementation
│   ├── GameStateBridge.cpp             # Game state bridge class implementation
│   ├── InputHandlerBridge.cpp          # Input handler bridge class implementation
│   ├── JsConsoleBridge.cpp             # JavaScript console bridge class implementation
│   ├── MultiConfigManager.cpp          # Multi-configuration manager implementation
│   └── README.md                       # Src directory documentation
├── .editorconfig                       # Editor code style configuration
├── .gitattributes                      # Git attributes configuration (line endings, etc.)
├── .gitignore                          # Git ignore rules
├── BackroomArchives.qrc                # Qt resource file for packaging static assets
├── BackroomArchives.ui                 # Qt UI file for generating UI classes
├── CHANGELOG.md                        # Changelog
├── CMakeLists.txt                      # Main CMake build script
├── CMakePresets.json                   # CMake preset configuration to simplify build options
├── CONTRIBUTING.md                     # Contribution guidelines
├── CodingStyle.md                      # Code style documentation
├── LICENSE.txt                         # GPL-3.0 license
├── NOTICE.txt                          # Legal notices
├── README.en.md                        # English project documentation
├── README.md                           # Chinese project documentation
├── main.cpp                            # Program main entry point
└── qt.cmake                            # Qt-related CMake configuration module
```

</details>

---

## VIII. Screenshots

Temporarily left blank.

More screenshots can be found in the [`screenshot/`](screenshot/README.md) directory.

---

## IX. Coding Style

The project follows a unified C++ coding style, detailed in the root **[CodingStyle.md](CodingStyle.md)**. Main conventions:

- Indentation: 4 spaces, K&R brace style
- Classes: `PascalCase`, variables/functions: `snake_case`, interface prefix `I`
- Headers: use `#pragma once`
- Logging macros with levels, avoid excessive logging in hot paths

Before submitting code, please ensure it adheres to the above style.

---

## X. FAQ

### Compilation & Runtime

<details>
<summary><b>Q1: CMake configuration cannot find Qt</b></summary>

**Symptom**:

```
Could not find a package configuration file provided by "Qt6" or "Qt5"
```

**Solution**:

- Make sure Qt is installed correctly and `CMAKE_PREFIX_PATH` points to the Qt installation directory (e.g., `C:/Qt/6.5.0/msvc2019_64`).
- Or set the environment variable `Qt6_DIR` / `Qt5_DIR`.
- On Linux, install the Qt development package via the package manager (e.g., `qt6-base-dev`); CMake will usually find it automatically.

</details>

<details>
<summary><b>Q2: CMake configuration fails with <code>dependency Qt6XXX could not be found</code> (e.g., WebChannel, Positioning)</b></summary>

**Symptom**:

```
Could NOT find Qt6WebChannel (missing: Qt6WebChannel_DIR)
Qt6WebEngineCore could not be found because dependency Qt6Positioning could not be found.
```

**Solution**:

- These errors indicate that your Qt installation is missing required dependency modules for `WebEngine` (`WebChannel`, `Positioning`, `Multimedia`, etc.).
- Open **Qt Maintenance Tool** → “Add or remove components” → Expand your Qt version (e.g., `Qt 6.9.3`) → Make sure the following components are checked:
    - `Qt WebChannel`
    - `Qt Positioning`
    - `Qt Multimedia` (optional but recommended)
    - `Qt WebEngine` (pulls the core libraries)
- If they are still not found, try switching to the official repository source (Maintenance Tool → Settings → Repositories → `https://download.qt.io/online/qtsdkrepository/`), then refresh and install.
- After installation, clean CMake cache (delete `CMakeCache.txt` and `CMakeFiles` folder) and reconfigure your project.

</details>

<details>
<summary><b>Q3: nlohmann/json download fails</b></summary>

**Symptom**:
During CMake configuration, an error occurs when downloading `json.hpp` from GitHub.

**Solution**:

- Check your network connection and ensure access to `raw.githubusercontent.com`.
- Download [json.hpp](https://github.com/nlohmann/json/releases/download/v3.12.0/json.hpp) manually and place it under `/include/nlohmann/` in the build directory (adjust path according to CMake output).
- Or modify `CMakeLists.txt` to use a local path of the header.

</details>

<details>
<summary><b>Q4: Plugin dynamic library fails to load with symbol not found</b></summary>

Ensure that the plugin source correctly exports `create_level` and `destroy_level` functions using `extern "C"` to avoid C++ name mangling. Also verify that the plugin filename matches the directory name (e.g., `level-0.dll` inside the `level-0/` directory).

</details>

<details>
<summary><b>Q5: Compilation errors related to C++20 features</b></summary>

**Symptom**:
Compiler errors such as `'std::span' is not a member of 'std'` or requirement of C++20 standard.

**Solution**:

- Verify compiler version: GCC ≥10, Clang ≥12, MSVC ≥2022.
- Explicitly specify C++ standard in CMake configuration: `-DCMAKE_CXX_STANDARD=20`.
- If using an older IDE (e.g., VS2019), upgrade to VS2022 or install a toolset that supports C++20.

</details>

<details>
<summary><b>Q6: The game stutters badly in Debug mode. How can I fix it?</b></summary>

**Symptoms**:
When compiled in Debug mode, the main WebEngine‑based interface becomes choppy and unresponsive, while the Release build runs perfectly smooth.

**Root cause**:
To simplify debugging, hardware acceleration (including accelerated 2D canvas and WebGL) is **explicitly disabled in Debug builds**. All rendering falls back to CPU software emulation, which is significantly slower. See `main.cpp`:

```cpp
#ifdef NDEBUG
    // Only Release enables hardware acceleration
    settings->setAttribute(QWebEngineSettings::Accelerated2dCanvasEnabled, true);
    settings->setAttribute(QWebEngineSettings::WebGLEnabled, true);
#else
    LOG_MODULE(... "Debug mode, hardware acceleration disabled");
#endif
```

**Solutions**:

- **Recommended**: Always use **Release** mode for playing or performance testing.
- If you really need Debug mode for debugging page logic, you can temporarily edit `main.cpp` and change `#ifdef NDEBUG` to `#if 1` to force acceleration on (but this might interfere with GPU‑process debugging).
- **Future plan**: When hardware acceleration is unavailable (e.g., Debug mode or old GPUs), the program may automatically reduce animation rates or disable heavy effects. This optimization is not yet implemented.

> If you are developing archive plugins or debugging the UI, consider using Release mode combined with logging – it offers both good performance and sufficient debuggability.

</details>

### Configuration Issues

<details>
<summary><b>Q7: Configuration changes do not take effect</b></summary>

**Symptom**:
Changed a value in `user.json`, but the program still uses the old value.

**Solution**:

- Confirm you are editing the correct file (priority order: `user.json` > `system.json` > `main.json`). If `system.json` or `main.json` define the same configuration path, they will be overridden but not deleted.
- Re‑run CMake to rebuild the project, or manually copy the modified config file to the `config/` directory under the build output.
- Check for JSON syntax errors (e.g., extra commas) using an online JSON validator.

</details>

<details>
<summary><b>Q8: How to recover lost configuration files?</b></summary>

**Symptom**:
Accidentally deleted a JSON file under the `config/` directory; the program reports errors or uses default values.

**Solution**:

- The program has built‑in default configurations (defined in `DefaultConfigs.cpp`). Missing files will be auto‑generated at runtime (provided the directory is writable).
- Alternatively, copy the example files from the `config/` directory in the source repository to the runtime directory.

</details>

### Plugin Development

<details>
<summary><b>Q9: How to add a new level?</b></summary>

1. Create a new folder under the corresponding archive version directory (e.g., `archives/wikidot/`), for example `level-2/`.
2. Inside the folder, create `level-2.cpp` that implements the `ILevel` interface and exports the factory functions.
3. Place private resources (text files, etc.) in the same folder.
4. Re‑run CMake configuration and build; the new level will be automatically scanned, compiled, and installed.

</details>

<details>
<summary><b>Q10: How to add a completely new archive version (e.g., Fandom)?</b></summary>

1. Create a `fandom/` directory under `archives/`.
2. Copy `archives/wikidot/CMakeLists.txt` to `fandom/CMakeLists.txt`.
3. Add levels as needed.
4. Add `fandom` to the matrix in `build.yml`.
5. After pushing a tag, CI will automatically build the `fandom` version and generate independent packages.

</details>

---

## XI. Contributing Guide

Issues and Pull Requests are welcome. Before contributing, please ensure:

- Code follows the [CodingStyle.md](CodingStyle.md) guidelines.
- New features or bug fixes have been tested locally.
- Relevant documentation (e.g., README, CHANGELOG) is updated.
- For major changes, open an issue first to discuss the design.

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed process.

---

## XII. License

The source code of this project itself is open‑sourced under the **GNU General Public License v3.0 only** (GPL-3.0-only). See the [LICENSE](LICENSE.txt) file in the project root for details.

Third‑party components used by this project are subject to their own licenses:

- **nlohmann/json**: MIT License

For the full text of third‑party licenses and notices, see [NOTICE.txt](NOTICE.txt) and the `licenses/` directory.

---

## XIII. Contact

- Author: [CrimsonSeraph]
- BiliBili: [浪天幽影(UID: 1741002917)](https://space.bilibili.com/1741002917?spm_id_from=333.1007.0.0)
- X: [𝒞𝓇𝒾𝓂𝓈𝑜𝓃𝒮𝑒𝓇𝒶𝓅𝒽✟升天✟(@CrimSeraph_QwQ)](https://x.com/CrimSeraph_QwQ)
- Project homepage: [https://github.com/CrimsonSeraph/BackroomArchives](https://github.com/CrimsonSeraph/BackroomArchives)

---

_May you safely traverse the Backrooms and find your way out._
