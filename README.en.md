# BackroomsArchives

**[中文](README.md) | English**

> **Navigation**
> - [I. Introduction](#i-introduction)
> - [II. Features](#ii-features)
> - [III. Dependencies](#iii-dependencies)
> - [IV. Quick Start](#iv-quick-start)
> - [V. Automated Build](#v-automated-build)
> - [VI. User Guide](#vi-user-guide)
> - [VII. Project Structure](#vii-project-structure)
> - [VIII. Screenshots](#viii-screenshots)
> - [IX. Coding Style](#ix-coding-style)
> - [X. FAQ](#x-faq)
> - [XI. Contributing](#xi-contributing)
> - [XII. License](#xii-license)
> - [XIII. Contact](#xiii-contact)

A **modular, plugin-based Backrooms text adventure game** with a lightweight GUI.

The core provides only the basic framework, plugin loading, and game loop. All levels, BUFFs, texts, and configurations are dynamically provided by **archive plugins**. Supports multiple archive versions (e.g., Wikidot, Fandom), each packaged independently, switchable at runtime.

Current version: `v0.1.0`
> See [CHANGELOG.md](CHANGELOG.md) for details.

---

## I. Introduction

**BackroomsArchives** is a text adventure game inspired by the Backrooms lore. Unlike traditional single games, all content (levels, rules, BUFFs, texts) exists as **plugins** under different "archive versions" (e.g., the Wikidot Backrooms archive, Fandom archive, etc.). The core only provides:

- Cross‑platform dynamic library loading (`.dll` / `.so` / `.dylib`)
- Plugin interfaces (`ILevel`, `IBuff`, `ArchiveCore`)
- Game loop (turn‑based or real‑time, defined by plugins)
- Lightweight GUI (text display, buttons, selection lists; console used only for logging)
- Simple configuration management (player base attributes, language, etc.)
- Logging system

Each archive version is completely self‑contained, with its own **core plugin** (global rules) and **level plugins** (specific level logic). Players download the complete package for a version and explore all implemented levels. New levels or entire archive versions can be added easily without modifying the core.

> **Current status**: core framework under construction.

---

## II. Features

- **Pure C++20 implementation**, cross‑platform (Windows / macOS / Linux)
- **Lightweight GUI** – console only for logging, interaction via window controls
- **Plugin‑based level system** – each level compiled as a standalone dynamic library, stored together with its private resources (texts, configs, images, etc.)
- **Separate archive versions** – different Backrooms wikis (Wikidot, Fandom, ...) completely isolated, independently packaged
- **Dynamic loading** – the core scans `archives/` at runtime, user selects version via GUI or config file
- **Core plugin support** – each archive can provide a core plugin (`wikidot_core`) for global BUFF management, cross‑level data, entry/exit rules, etc.
- **JSON‑based config & texts** – `nlohmann/json` used for parsing, supports multi‑language texts (per‑level or global)
- **Component‑based packaging** – CPack generates `core‑only` packages (just the core) and full packages (core + selected archive)
- **Automated CI** – GitHub Actions builds multiple platforms and archive versions, then publishes releases

---

## III. Dependencies

### 1. System dependencies
- **C++ compiler**: C++20 support (GCC 11+, Clang 14+, MSVC 2022)
- **CMake**: 3.16 or higher
- **Dynamic linker/loader**: platform native (Windows `LoadLibrary`, Linux/macOS `dlopen`)

### 2. Third‑party libraries
- **[nlohmann/json](https://github.com/nlohmann/json)** (version 3.12.0)
  Used for JSON parsing. CMake automatically downloads the single header at configure time.

### 3. Runtime dependencies
- None. All archive plugins are dynamic libraries loaded by the core at runtime.

---

## IV. Quick Start

### 1. Get the source code

```bash
git clone https://github.com/CrimsonSeraph/BackroomsArchives.git
cd BackroomsArchives
```

### 2. Configure CMake (using `wikidot` archive as an example)

```bash
cmake -B build -DCMAKE_BUILD_TYPE=Release -DARCHIVE_VERSION=wikidot -DBUILD_ARCHIVES=ON
```

- `ARCHIVE_VERSION`: selects the archive version (subdirectory under `archives/`)
- `BUILD_ARCHIVES`: set to `ON` to build archive plugins; `OFF` for core‑only

### 3. Build

```bash
cmake --build build --config Release
```

### 4. Install to a temporary directory (to inspect the result)

```bash
cmake --install build --prefix install_full
```

The installed directory structure is described in [Project Structure](#vii-project-structure).

### 5. Run

```bash
# Windows
./install_full/BackroomsArchives.exe

# Linux / macOS
./install_full/BackroomsArchives
```

The program will scan `install_full/archives/` for available archive versions, let the user select one (with GUI controls), and then start the game loop.

### 6. Package (create distribution archives)

```bash
cpack --config build/CPackConfig.cmake -B package -G ZIP
```

Generated full packages are placed under `package/`, named like `BackroomsArchives-wikidot-Windows.zip`.

---

## V. Automated Build

This project uses GitHub Actions for continuous integration and delivery. Workflow files are located in `.github/workflows/`:

- **`build.yml`** – triggered when a tag starting with `v` is pushed (e.g., `v0.1.0`) or manually. Builds on Ubuntu, Windows, macOS, for each archive version in the matrix (`wikidot`, `fandom`), then installs and packages.
- **`release.yml`** – after a successful build workflow, downloads all artifacts, extracts the corresponding release notes from `CHANGELOG.md`, creates a GitHub Release and attaches all packages.

You can modify `matrix.archive` in `build.yml` to add or remove archive versions.

---

## VI. User Guide

### 1. Archive version selection

At startup, the GUI window lists all subdirectories under `archives/` (each is an archive version, e.g., `wikidot`, `fandom`). The user selects one via dropdown or button. A default version can be set in `config/game.json` (`active_archive` field). After selection, the core loads the archive’s core plugin (if present) and then scans the version directory for level subdirectories, loading each level plugin.

### 2. Archive version structure (example for `wikidot`)

```
archives/wikidot/
├── wikidot_core.dll      # archive core plugin (optional, built from core.cpp)
├── version.json          # archive metadata (name, description, version, etc.)
├── texts/                # archive public texts (multi‑language)
│   ├── en/
│   └── zh/
├── config/               # archive public configuration (global rules, BUFF definitions, ...)
├── level-0/              # level directory (name can be arbitrary, but `level-` prefix recommended)
│   ├── level-0.dll       # level plugin (built from level-0.cpp)
│   └── level_text.json   # private resources for this level
├── level-1/
└── ...
```

### 3. Writing a level plugin

Each level directory must contain a `.cpp` file with the same name as the directory. The file must export the following functions (using `extern "C"` to avoid name mangling):

```cpp
#include "plugin_api/ILevel.h"

extern "C" ILevel* create_level() {
    return new MyLevel();
}

extern "C" void destroy_level(ILevel* p) {
    delete p;
}
```

`ILevel` is a pure abstract class defined in `include/plugin_api/ILevel.h`:

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

If an archive needs global management (cross‑level BUFFs, auto‑unload rules, unified entry logic), you can provide `core.cpp` at the archive root. It will be compiled into a plugin named `${ARCHIVE_VERSION}_core`. The core plugin must implement the `ArchiveCore` interface (defined in `plugin_api/ArchiveCore.h`) and export a factory function.

### 5. Configuration

Core configuration resides in `config/` (JSON format). The structure is still being finalized.

### 6. Multi‑language texts

- **Global texts**: placed in `texts/{lang}/`, loaded by the core (e.g., welcome messages, error prompts)
- **Archive public texts**: placed in `archives/wikidot/texts/{lang}/`, loaded by the archive core plugin
- **Level private texts**: placed inside the level directory (e.g., `level-0/description.json`), loaded by the level plugin itself

### 7. Logging

The logging system provides macros `LOG_DEBUG`, `LOG_INFO`, `LOG_WARN`, `LOG_ERROR`. Output goes to the console (a separate window). Log levels can be adjusted in the core configuration.

---

## VII. Project Structure

<details>
<summary> Click to expand directory tree </summary>

```
BackroomsArchives/
├── .github/                            # GitHub configuration
│   └── workflows/                      # CI/CD workflows
│       ├── build.yml                   # Build & test workflow
│       └── release.yml                 # Release workflow
├── archives/                           # Archive versions
│   ├── wikidot/                        # Wikidot archive
│   │   ├── assets/                     # Global static resources
│   │   ├── config/                     # Global configuration
│   │   ├── level-0/                    # Level directory
│   │   ├── ......                      # Other levels
│   │   ├── texts/                      # Global texts (multi‑language)
│   │   ├── CMakeLists.txt              # Build script for this archive
│   │   ├── core.cpp                    # Core plugin source (optional)
│   │   ├── core.h                      # Core plugin header
│   │   ├── README.md                   # Archive description
│   │   └── version.json                # Archive metadata
│   └── README.md                       # Archives directory description
├── assets/                             # Static resources (images, etc.)
│   └── README.md                       # Assets description
├── config/                             # Default configuration directory
│   ├── game.json                       # Game configuration file
│   └── README.md                       # Config description
├── include/                            # Public headers (including plugin_api)
│   ├── plugin_api/                     # Plugin interface headers
│   │   └── README.md                   # Plugin API description
│   └── README.md                       # Include description
├── licenses/                           # Third‑party licenses
│   └── LICENSE.MIT.txt                 # MIT license for nlohmann/json
├── screenshot/                         # Screenshots
│   └── README.md                       # Screenshot description
├── src/                                # C++ source files
│   ├── main.cpp                        # Main entry point
│   └── README.md                       # Source description
├── .editorconfig                       # Editor style configuration
├── .gitattributes                      # Git attributes (line endings, etc.)
├── .gitignore                          # Git ignore rules
├── CHANGELOG.md                        # Changelog
├── CMakeLists.txt                      # Main CMake build script
├── CONTRIBUTING.md                     # Contributing guide
├── CodingStyle.md                      # Coding style document
├── LICENSE.txt                         # GPL-3.0 license
├── NOTICE.txt                          # Notices
├── README.en.md                        # English README
└── README.md                           # Project README
```
</details>

---

## VIII. Screenshots

(Temporarily empty)

See the [`screenshot/`](screenshot/README.md) directory for more.

---

## IX. Coding Style

The project follows a unified C++ coding style. See [CodingStyle.md](CodingStyle.md) in the root directory. Main conventions:

- 4 spaces for indentation, K&R brace style
- Class names `PascalCase`, variables/functions `snake_case`, interface prefix `I`
- Header files use `#pragma once`
- Logging macros with levels, avoid excessive logging in hot paths

Please adhere to the style before submitting code.

---

## X. FAQ

<details>
<summary><b>Q1: Compilation fails because nlohmann/json.hpp cannot be found</b></summary>

CMake automatically downloads the header from GitHub. If network issues cause a failure, manually download [json.hpp](https://github.com/nlohmann/json/releases/download/v3.12.0/json.hpp) and place it under `include/nlohmann/` in the build directory, or modify `CMakeLists.txt` to use a local path.

</details>

<details>
<summary><b>Q2: Plugin dynamic library fails to load – symbol not found</b></summary>

Ensure the plugin source correctly exports `create_level` and `destroy_level` functions with `extern "C"`. Also verify that the plugin file name matches the directory name (e.g., `level-0.dll` inside `level-0/`).

</details>

<details>
<summary><b>Q3: How do I add a new level?</b></summary>

1. Create a new folder under the archive version (e.g., `archives/wikidot/level-2/`).
2. Inside that folder, create `level-2.cpp` implementing `ILevel` and exporting the factory functions.
3. Place any private resources (text files, etc.) in the same folder.
4. Re‑run CMake configuration and build. The new level will be automatically detected, compiled, and installed.

</details>

<details>
<summary><b>Q4: How do I add a completely new archive version (e.g., Fandom)?</b></summary>

1. Create `archives/fandom/`.
2. Copy `archives/wikidot/CMakeLists.txt` into `archives/fandom/CMakeLists.txt`.
3. Add levels inside `fandom/` following the same structure.
4. Add `fandom` to `matrix.archive` in `build.yml`.
5. Push a tag, and CI will build the `fandom` version and produce separate packages.

</details>

---

## XI. Contributing

Issues and pull requests are welcome. Before contributing, please ensure:

- Code follows [CodingStyle.md](CodingStyle.md).
- New features or bug fixes are tested locally.
- Relevant documentation (README, CHANGELOG) is updated.
- For larger changes, open an issue for discussion first.

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## XII. License

The source code of this project is licensed under **GNU General Public License v3.0 only** (GPL-3.0-only). See [LICENSE.txt](LICENSE.txt) for details.

Third‑party dependencies have their own licenses:
- **nlohmann/json**: MIT License

For full license texts, see [NOTICE.txt](NOTICE.txt) and the `licenses/` directory.

---

## XIII. Contact

- Author: [CrimsonSeraph]
- BiliBili: [浪天幽影(UID: 1741002917)](https://space.bilibili.com/1741002917?spm_id_from=333.1007.0.0)
- X: [𝒞𝓇𝒾𝓂𝓈𝑜𝓃𝒮𝑒𝓇𝒶𝓅𝒽✟升天✟(@CrimSeraph_QwQ)](https://x.com/CrimSeraph_QwQ)
- Project homepage: [https://github.com/CrimsonSeraph/BackroomsArchives](https://github.com/CrimsonSeraph/BackroomsArchives)

---

*Stay safe and may you find the exit.*
