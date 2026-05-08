# BackroomsArchives

**[English](README.en.md) | 中文**

> **目录**
> - [一、项目简介](#一项目简介)
> - [二、功能特性](#二功能特性)
> - [三、依赖项](#三依赖项)
> - [四、快速开始](#四快速开始)
> - [五、自动化构建](#五自动化构建)
> - [六、使用说明](#六使用说明)
> - [七、项目结构](#七项目结构)
> - [八、截图](#八截图)
> - [九、编码规范](#九编码规范)
> - [十、FAQ](#十faq)
> - [十一、贡献指南](#十一贡献指南)
> - [十二、许可证](#十二许可证)
> - [十三、联系方式](#十三联系方式)

一个**模块化、插件化的后室主题文字游戏**。

一个基于 Qt 的文字游戏，项目采用 C++20 编写。 
本体仅提供基础框架、插件加载与游戏核心循环，所有层级、BUFF、文本、配置等内容基本均由 **档案插件** 动态提供。支持多档案版本（如 Wikidot、Fandom 等），每个版本独立打包，运行时切换。

> 👉 想开发档案插件？请查看 [FAQ - 插件开发](#faq---插件开发)

当前版本号: `v0.1.0`
> 详细请查看: [更新日志](CHANGELOG.md)。

---

## 一、项目简介

**BackroomsArchives** 是一款受后室（Backrooms）设定启发的文字游戏。与传统的单一游戏不同，本项目的所有内容——包括层级、规则、BUFF、文本——都以**插件形式**存在，存储在不同的“档案版本”下（例如基于 Wikidot 社区的后室档案、Fandom 档案等）。本体只负责提供：

- 基本的内容与资源加载框架
- 跨平台动态库加载（Windows `.dll`、Linux `.so`、macOS `.dylib`）
- 插件接口（`ILevel`, `IBuff`, `ArchiveCore`）
- 游戏主循环（回合制或实时，由插件定义）
- 轻量级图形界面（用于展示文本、按钮、选择列表等，控制台专用于日志）
- 简单的配置管理（玩家基础属性、语言等）
- 日志系统

每个档案版本完全独立，包含自己的 **核心插件**（管理全局规则）与 **层级插件**（具体层级逻辑）。玩家下载对应的完整包后，即可探索该版本下所有已实现的层级。未来可以轻松添加新层级或全新档案版本，无需修改本体。

> **当前状态**: 搭建基础框架中。

---

## 二、功能特性

- **纯 C++20 实现**，跨平台（Windows / macOS / Linux）
- **轻量级图形界面**：控制台仅用于日志，交互通过窗口控件进行
- **插件化层级系统**：每个层级编译为独立动态库，与私有资源（文本、配置、图片等）存放在同一目录
- **档案版本分离**：不同后室维基（Wikidot、Fandom 等）的数据与逻辑完全隔离，可独立打包发布
- **动态加载机制**：本体自动扫描 `archives/` 下的版本目录，运行时让用户选择或通过配置文件指定
- **核心插件支持**：每个档案版本可提供一个核心插件（`wikidot_core`），用于全局 BUFF 管理、跨层级数据、入口/出口规则等
- **基于 JSON 的配置与文本**：使用 `nlohmann/json` 解析，支持多语言文本（按层级或全局存放）
- **组件化打包**：利用 CPack 生成 `core-only` 包（仅本体）和完整包（本体+指定档案版本）
- **自动化 CI**：GitHub Actions 自动构建多平台、多档案版本，并发布到 Releases

---

## 三、依赖项

### 1. 系统依赖
- **C++ 编译器**: 支持 C++20 标准（GCC 11+、Clang 14+、MSVC 2022）
- **CMake**: 3.16 或更高版本
- **Qt**: 5.15 或 6.x（Core、Gui、Widgets）
- **动态链接器 / 加载库**: 各平台自带（Windows `LoadLibrary`、Linux/macOS `dlopen`）

> 推荐使用Qt 6.x，CMake 会自动检测并配置。  
  推荐使用 VS2022/2026（MSVC）进行 Windows 开发，Linux/macOS 可使用 GCC 或 Clang。

### 2. 第三方库
- **[nlohmann/json](https://github.com/nlohmann/json)** (版本 3.12.0)
  用于 JSON 解析。CMake 会在配置时自动从 GitHub 下载单头文件到构建目录。

### 3. 运行时依赖
- 无额外依赖。所有档案插件均为动态库，由本体在运行时加载。

---

## 四、快速开始

### 1. 获取源码

```bash
git clone https://github.com/CrimsonSeraph/BackroomsArchives.git
cd BackroomsArchives
```

### 2. 配置 CMake（以 wikidot 档案版本为例）

```bash
cmake -B build -DCMAKE_BUILD_TYPE=Release -DARCHIVE_VERSION=wikidot -DBUILD_ARCHIVES=ON
```

- `ARCHIVE_VERSION`: 选择要构建的档案版本（对应 `archives/` 下的子目录）
- `BUILD_ARCHIVES`: 设为 `ON` 时编译档案插件；若只需本体可设为 `OFF`
- 对于 Qt6，CMake 通常能自动找到；若使用 Qt5，请确保 `Qt5` 包可用。

> 👉 配置或编译失败？请查看 [FAQ - 编译与运行](#faq---编译与运行)

### 3. 编译

```bash
cmake --build build --config Release
```

### 4. 安装到临时目录（查看结果）

```bash
cmake --install build --prefix install_full
```

安装后的目录结构参见下文 [项目结构](#七项目结构)。

### 5. 运行

```bash
# Windows
./install_full/BackroomsArchives.exe

# Linux / macOS
./install_full/BackroomsArchives
```

程序会扫描 `install_full/archives/` 下的可用档案版本，提示用户选择（若只有一个版本则直接加载），然后进入游戏主循环。

### 6. 打包（生成分发包）

```bash
cpack --config build/CPackConfig.cmake -B package -G ZIP
```

生成的完整包位于 `package/` 目录下，命名如 `BackroomsArchives-wikidot-Windows.zip`。

---

## 五、自动化构建

本项目利用 GitHub Actions 实现持续集成与交付，配置文件位于 `.github/workflows/`：

- **`build.yml`**：当推送以 `v` 开头的标签（如 `v0.1.0`）或手动触发时，会在 Ubuntu、Windows、macOS 三个平台上，分别以 `wikidot` 和 `fandom`（可调整矩阵）为档案版本进行构建、安装、打包，并上传 artifacts。
- **`release.yml`**：在上一个工作流成功完成后，自动下载所有 artifacts，提取 `CHANGELOG.md` 中对应版本的发布说明，创建 GitHub Release 并附上所有安装包。

你可以根据实际支持的档案版本修改 `build.yml` 中的 `matrix.archive` 列表。

---

## 六、使用说明

### 1. 档案版本选择

游戏启动时，会扫描 `archives/` 目录下的所有子目录，每个子目录视为一个档案版本（如 `wikidot`、`fandom`）。如果没有配置文件记录上次选择的版本，程序会列出所有可用版本并要求用户输入编号。选择后，该版本的档案核心插件（若存在）被加载，然后扫描该版本下的所有层级目录，加载每个层级的插件。

用户可通过配置文件 `config/game.json`（本体配置）中的 `"active_archive"` 字段固定默认版本，避免每次手动选择。

### 2. 档案版本结构（以 `wikidot` 为例）

```
archives/wikidot/
├── wikidot_core.dll      # 档案核心插件（可选，编译自 core.cpp）
├── version.json          # 档案元信息（名称、描述、版本等）
├── texts/                # 档案公共文本（多语言）
│   ├── en/
│   └── zh/
├── config/               # 档案公共配置（全局规则、BUFF 定义等）
├── level-0/              # 层级目录（名称可自定义，建议 level- 前缀）
│   ├── level-0.dll       # 层级插件（编译自 level-0.cpp）
│   └── level_text.json   # 该层级的私有资源
├── level-1/
└── ...
```

### 3. 编写层级插件

每个层级目录下需要包含一个与目录同名的 `.cpp` 源文件，实现以下导出函数（使用 `extern "C"` 避免名称修饰）：

```cpp
#include "plugin_api/ILevel.h"

extern "C" ILevel* create_level() {
    return new MyLevel();
}

extern "C" void destroy_level(ILevel* p) {
    delete p;
}
```

其中 `ILevel` 是定义在 `include/plugin_api/ILevel.h` 中的纯虚类：

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

`GameContext` 提供对玩家属性、日志、全局状态等的访问接口。

### 4. 档案核心插件

如果档案需要全局管理（如跨层级 BUFF、自动卸载规则、统一入口逻辑），可以在档案根目录提供 `core.cpp`，编译为 `${ARCHIVE_VERSION}_core` 插件。核心插件需实现 `ArchiveCore` 接口（定义在 `plugin_api/ArchiveCore.h`），并在导出函数中返回实例。

主程序加载档案版本时会优先加载该核心插件，并调用其初始化方法。

### 5. 配置文件

系统包含两个配置文件，按优先级从低到高依次为:

- `main.json`: 主配置，优先级 0
- `user.json`: 用户配置，优先级 1

高优先级的配置项会覆盖低优先级的同路径配置。
**注意: ** 即使有覆盖逻辑，仍不建议在不同配置文件中定义相同属性
配置文件中 `__priority` 字段用于定义优先级，不可删除。

> 若配置文件丢失将从默认配置（`DefaultConfigs.cpp`）加载，并在程序运行时自动生成缺失的配置文件。

> 👉 配置文件相关问题请查看 [FAQ - 配置问题](#faq---配置问题)

<details>
<summary><b>`game.json` 示例：</b></summary>

```json
{

}
```

</details>

**注意: ** 其中 `"version"` 与 `"BackroomsArchives"` 为检查字段，内容随意，但 **请勿删除或修改** 此字段。

档案版本的公共配置文件位于 `archives/wikidot/config/` 下，具体内容由档案核心插件定义。

### 6. 多语言文本

- **全局文本**：放在 `texts/{lang}/` 下，由本体读取（如欢迎信息、错误提示等）
- **档案公共文本**：放在 `archives/wikidot/texts/{lang}/` 下，由档案核心插件负责加载
- **层级私有文本**：放在层级目录内（如 `level-0/description.json`），由层级插件自行读取

### 7. 日志

日志系统提供宏 `LOG_DEBUG`、`LOG_INFO`、`LOG_WARN`、`LOG_ERROR`，可输出到控制台和文件（若启用）。日志级别可在本体配置中调整。

---

## 七、项目结构

<details>
<summary> 点击展开目录树 </summary>

```
BackroomsArchives/
├── .github/                            # GitHub 配置目录
│   └── workflows/                      # CI/CD 工作流
│       ├── build.yml                   # 构建与测试工作流
│       └── release.yml                 # 发布工作流
├── archives/                           # 档案版本目录
│   ├── wikidot/                        # wikidot 档案版本
│   │   ├── assets/                     # 全局静态资源（如全局图片）
│   │   ├── config/                     # 全局配置文件（如全局 BUFF 定义）
│   │   ├── level-0/                    # 层级 level-0 目录
│   │   ├── ......                      # 其他层级目录
│   │   ├── texts/                      # 全局文本（多语言）
│   │   ├── CMakeLists.txt              # wikidot 档案版本的构建脚本
│   │   ├── core.cpp                    # wikidot 档案核心插件源文件
│   │   ├── core.h                      # wikidot 档案核心插件头文件
│   │   ├── README.md                   # wikidot 档案说明
│   │   └── version.json                # 档案元信息
│   └── README.md                       # archives 目录说明
├── assets/                             # 静态资源（图片等）
│   └── README.md                       # assets 目录说明
├── config/                             # 默认配置文件目录
│   ├── main.json                       # 主配置文件
│   ├── README.md                       # config 目录说明
│   └── user.json                       # 用户配置文件
├── include/                            # 公共头文件
│   ├── plugin_api/                     # 插件接口头文件
│   │   └── README.md                   # plugin_api 目录说明
│   ├── AppConfig.h                     # 配置系统主接口
│   ├── AppConfig_impl.hpp              # 配置系统模板实现
│   ├── AppConfig_utils.hpp             # 配置辅助工具类
│   ├── BackroomArchives.h              # 核心档案管理模块头文件
│   ├── ConfigManager.h                 # 单配置文件管理器
│   ├── ConfigManager_impl.hpp          # ConfigManager 模板实现
│   ├── ConfigStructs.h                 # 配置数据结构体
│   ├── Console.h                       # 控制台管理
│   ├── DebugLog.h                      # 日志系统
│   ├── DebugLog_utils.hpp              # 日志辅助工具
│   ├── DefaultConfigs.h                # 默认配置工厂
│   ├── MultiConfigManager.h            # 多配置管理器
│   ├── MultiConfigManager_impl.hpp     # MultiConfigManager 模板实现
│   └── README.md                       # include 目录说明
├── licenses/                           # 第三方许可证文件
│   └── LICENSE.MIT.txt                 # nlohmann/json 的 MIT 许可证
├── screenshot/                         # 截屏资源文件
│   └── README.md                       # screenshot 目录说明
├── src/                                # C++ 源文件
│   ├── AppConfig.cpp                   # 配置系统实现
│   ├── BackroomArchives.cpp            # 核心档案管理模块实现
│   ├── ConfigManager.cpp               # 单配置管理器实现
│   ├── ConfigStructs.cpp               # 配置结构体实现
│   ├── Console.cpp                     # 控制台管理实现
│   ├── DebugLog.cpp                    # 日志系统实现
│   ├── DefaultConfigs.cpp              # 默认配置工厂实现
│   ├── MultiConfigManager.cpp          # 多配置管理器实现
│   └── README.md                       # src 目录说明
├── .editorconfig                       # 编辑器代码风格配置
├── .gitattributes                      # Git 属性配置（换行符等）
├── .gitignore                          # Git 忽略文件规则
├── BackroomArchives.qrc                # Qt 资源文件，用于打包静态资源
├── BackroomArchives.ui                 # Qt 界面文件，用于生成 UI 类
├── CHANGELOG.md                        # 更新日志
├── CMakeLists.txt                      # CMake 主构建脚本
├── CMakePresets.json                   # CMake 预设配置，简化构建选项
├── CONTRIBUTING.md                     # 贡献指南
├── CodingStyle.md                      # 代码规范文档
├── LICENSE.txt                         # GPL-3.0 许可证
├── NOTICE.txt                          # 声明
├── README.en.md                        # 英文项目说明文档
├── README.md                           # 中文项目说明文档
├── main.cpp                            # 程序主入口
└── qt.cmake                            # Qt 相关的 CMake 配置模块
```

</details>

---

## 八、截图

暂时留空

更多截图请查看 [`screenshot/`](screenshot/README.md) 目录。

---

## 九、编码规范

项目遵循统一的 C++ 编码风格，详见根目录下的 **[CodingStyle.md](CodingStyle.md)**。主要约定包括：

- 缩进使用 4 个空格，K&R 括号风格
- 类名 `PascalCase`，变量/函数 `snake_case`，接口类前缀 `I`
- 头文件使用 `#pragma once`
- 日志宏分级输出，避免热点路径过度打印

在提交代码前，请确保遵循上述规范。

---

## 十、FAQ

### 编译与运行

<details>
<summary><b>Q1: CMake 配置时找不到 Qt</b></summary>

**现象**:
```
Could not find a package configuration file provided by "Qt6" or "Qt5"
```

**解决方案**:
- 确保 Qt 已正确安装，并且 `CMAKE_PREFIX_PATH` 指向 Qt 的安装目录（例如 `C:/Qt/6.5.0/msvc2019_64`）。
- 或者设置环境变量 `Qt6_DIR` / `Qt5_DIR`。
- 在 Linux 上可以通过包管理器安装 Qt 开发包（如 `qt6-base-dev`），CMake 通常能自动找到。

</details>

<details>
<summary><b>Q2: nlohmann/json 下载失败</b></summary>

**现象**:
CMake 配置过程中报错，无法从 GitHub 下载 `json.hpp`。

**解决方案**:
- 检查网络连接，确保能够访问 `raw.githubusercontent.com`。
- 手动下载 [json.hpp](https://github.com/nlohmann/json/releases/download/v3.12.0/json.hpp) 并放入构建目录的 `/include/nlohmann/` 下（根据 CMake 输出路径调整）。
- 或者修改 `CMakeLists.txt`，改用本地已下载的头文件路径。

</details>

<details>
<summary><b>Q3: 插件动态库无法加载，提示找不到符号</b></summary>

确保插件的源文件中正确导出了 `create_level` 和 `destroy_level` 函数，并且使用 `extern "C"` 避免 C++ 名称修饰。同时检查插件文件名是否与目录名一致（例如 `level-0.dll` 应位于 `level-0/` 目录内）。

</details>

<details>
<summary><b>Q4: 编译时出现 C++20 相关语法错误</b></summary>

**现象**:
编译器报错如 `'std::span' is not a member of 'std'` 或要求 C++20 标准。

**解决方案**:
- 确认编译器版本: GCC ≥10、Clang ≥12、MSVC ≥2022。
- 在 CMake 配置时显式指定 C++ 标准: `-DCMAKE_CXX_STANDARD=20`。
- 若使用旧版 IDE（如 VS2019），需要升级到 VS2022 或安装支持 C++20 的工具集。

</details>

### 配置问题

<details>
<summary><b>Q5: 配置文件修改后不生效</b></summary>

**现象**:
修改了 `user.json` 中的某个值，但程序运行时使用的还是旧值。

**解决方案**:
- 确认修改的文件是正确的（注意优先级: `user.json` > `system.json` > `main.json`）。如果 `system.json` 或 `main.json` 中定义了相同路径的配置，它们会被覆盖，但不会删除。
- 重新执行 CMake 构建项目或手动将修改后的配置文件复制到构建目录的 `/config/` 下。
- 检查 JSON 格式是否正确（如多余的逗号），可以使用在线 JSON 校验工具。

</details>

<details>
<summary><b>Q6: 配置文件丢失后如何恢复？</b></summary>

**现象**:
误删了 `config/` 目录下的某个 JSON 文件，程序启动报错或使用默认值。

**解决方案**:
- 程序内置了默认配置（定义在 `DefaultConfigs.cpp`），丢失的文件会在运行时自动重新生成（前提是目录存在）。只需确保 `config/` 目录可写。
- 也可以从源码仓库中复制 `config/` 目录下的示例文件到运行目录。

</details>

### 插件开发

<details>
<summary><b>Q7: 如何添加一个新层级？</b></summary>

1. 在对应档案版本目录下（如 `archives/wikidot/`）创建一个新文件夹，例如 `level-2/`。
2. 在文件夹内创建 `level-2.cpp`，实现 `ILevel` 接口并导出工厂函数。
3. 将私有资源（文本文件等）放入同一文件夹。
4. 重新运行 CMake 配置与构建，新层级会自动被扫描、编译并安装。

</details>

<details>
<summary><b>Q8: 如何添加一个全新的档案版本（例如 Fandom）？</b></summary>

1. 在 `archives/` 下创建 `fandom/` 目录。
2. 复制 `archives/wikidot/CMakeLists.txt` 到 `fandom/CMakeLists.txt`。
3. 按层级结构添加内容。
4. 在 `build.yml` 的矩阵中加入 `fandom`。
5. 推送标签后，CI 会自动构建 `fandom` 版本并生成独立安装包。

</details>

---

## 十一、贡献指南

欢迎提交 Issue 和 Pull Request。贡献前请确保：

- 代码遵循 [CodingStyle.md](CodingStyle.md) 规范。
- 新功能或 bug 修复经过本地测试。
- 更新相关文档（如 README、CHANGELOG）。
- 对于较大改动，建议先开 Issue 讨论设计。

详细流程请参考 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 十二、许可证

本项目自身源代码采用 **GNU General Public License v3.0 only**（GPL-3.0-only）开源。详情请参阅项目根目录下的 [LICENSE](LICENSE.txt) 文件。

本项目依赖的第三方组件适用不同的许可证:
- **nlohmann/json**: MIT 许可证

有关第三方许可证的完整声明和文本，请查看 [NOTICE.txt](NOTICE.txt) 及 `licenses/` 目录。

---

## 十三、联系方式

- 作者: [CrimsonSeraph]
- BiliBili: [浪天幽影(UID: 1741002917)](https://space.bilibili.com/1741002917?spm_id_from=333.1007.0.0)
- X: [𝒞𝓇𝒾𝓂𝓈𝑜𝓃𝒮𝑒𝓇𝒶𝓅𝒽✟升天✟(@CrimSeraph_QwQ)](https://x.com/CrimSeraph_QwQ)
- 项目主页: [https://github.com/CrimsonSeraph/BackroomsArchives](https://github.com/CrimsonSeraph/BackroomsArchives)

---

*祝你安全穿越后室，愿你找到出口。*
