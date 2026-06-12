# Contributing to BackroomArchives

感谢你考虑为 BackroomArchives 贡献代码！我们欢迎任何形式的贡献，包括提交 Bug 报告、功能请求、代码改进、文档更新等。

在参与贡献之前，请花一点时间阅读本指南，以确保你的贡献能够顺利被合并。

## 行为准则

本项目遵守 [贡献者公约](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)，具体细则请参阅项目根目录下的 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

参与即表示你同意遵守其条款。

## 如何报告问题（Issue）

如果你发现了 Bug、有功能建议或对文档有疑问，请在 [GitHub Issues](https://github.com/CrimsonSeraph/BackroomArchives/issues) 页面提交。

### 提交前请先检查

- 搜索现有 Issues，避免重复提交。
- 确认你使用的是最新版本（或相关的 commit）。

### Bug 报告模板

请尽量使用以下模板填写:

```markdown
**描述**
清晰简洁地描述问题是什么。

**复现步骤**
1. 执行 ... 命令/操作
2. 点击 ... 按钮
3. 看到错误信息 ...

**预期行为**
你期望发生什么？

**截图/日志**
如果有，请附上相关截图或控制台输出日志（注意脱敏）。

**环境信息**
- 操作系统: Windows 10 / macOS 14 / Ubuntu 22.04
- 项目版本或 commit hash: v0.5.1 或 xxxxxx

**额外信息**
其他你觉得有用的信息。
```

### 功能请求模板

```markdown
**你的功能请求与什么问题相关？**
清晰描述背景和痛点。

**描述你想要的解决方案**
简明扼要。

**描述你考虑过的替代方案**
如果有。

**其他**
补充说明。
```

## 如何贡献代码（Pull Request）

我们欢迎 Pull Request (PR)。在提交前，请确保你的修改符合以下要求。

### 1. 分支与同步

- 从 `main` 分支创建你的功能分支: `git checkout -b feature/your-feature-name` 或 `fix/bug-description`。
- 提交前请先 rebase 到最新的 `main` 分支: `git fetch origin && git rebase origin/main`。
- 解决可能出现的冲突。

### 2. 代码风格

本项目有详细的编码规范，请务必遵守 **[CodingStyle.md](CodingStyle.md)** 中的规则。

关键要点回顾:
- **编码**: UTF‑8 without BOM，换行符 CRLF（Windows 风格），文件末尾保留一个空行。
- **缩进**: 4 个空格，不使用 Tab。
- **命名**:
  - C++ 类: `PascalCase`
  - 变量/函数: `snake_case`
  - 常量/宏: `UPPER_CASE`
  - Python 模块文件名: `PascalCase`（如 `Bridge.py`）
  - Qt 虚函数（如 `paintEvent`）保持 Qt 原有风格。
- **头文件**: 使用 `#pragma once`。
- **头文件分区顺序**: `public:` → `protected:` → `private:` → `signals:` → `private slots:`。每个分区内部按规则排列。
- **源文件**: 函数定义顺序必须与头文件声明顺序一致。
- **注释**: 复杂函数使用 Doxygen 风格（`/// @brief` 等）；简单函数可用单行注释。
- **日志**: 合理使用 `LOG_MODULE` 宏，避免高频输出。

> 如果你的编辑器支持，可以配置自动格式化（项目根目录有 `.editorconfig`）。

### 3. Commit 规范

我们推荐使用语义化的提交信息格式:

```
<type>(<scope>): <subject>

<body>

<footer>
```

- **type**: `feat`（新功能）、`fix`（Bug 修复）、`docs`（文档）、`style`（格式，不影响代码逻辑）、`refactor`（重构）、`perf`（性能优化）、`test`（测试）、`chore`（构建/工具变动）
- **scope**（可选）: 影响的模块，如 `config`、`rule`、`python`、`ui` 等
- **subject**: 简短描述，不超过 50 字符，使用英文或中文（尽量英文）
- **body**（可选）: 详细描述改动的原因和内容
- **footer**（可选）: 关闭 Issue 用 `Closes #123`

**示例**:

```
feat(rule): add formula builder dialog

Add a dialog for editing value pattern with syntax checking.
Closes #42
```

```
fix(python): handle websocket connection timeout

Prevent Bridge.py from hanging when server is unreachable.
```

### 4. 测试要求

- 确保你的修改可以通过编译（至少使用 MSVC 和 GCC 之一）。
- 如果添加了新功能，请尽量在本地手动测试主要场景。
- 对于影响 Python 子进程的修改，请测试 `Bridge.py` 能正常启动并与主程序通信。
- 目前项目未配置自动化单元测试，但 CI 会执行编译检查。未来欢迎添加测试用例。

### 5. 提交 PR

- 推送到你自己的 fork 仓库后，在 GitHub 上发起 Pull Request。
- PR 标题应简明扼要，内容描述:
  - 解决了什么问题（关联 Issue 编号）。
  - 改动的简要概述。
  - 如果引入破坏性更改，请说明。
- 确保 PR 的 base 分支是 `main`。
- 如果 CI 检查（GitHub Actions）失败，请及时修复。
- 等待代码审查。审查者可能会要求修改，请积极回应。

### 6. 关于依赖更新

- 如果你需要升级 Qt 版本或 Python 依赖，请先在 Issue 中讨论，因为可能影响构建环境。
- 修改 `CMakeLists.txt` 中的依赖下载方式时，注意保持向后兼容。

## 关于硬件加速与 Debug/Release 模式

本项目的主界面基于 QtWebEngine 渲染，并依赖 **GPU 硬件加速** 来保证页面动画（尤其是 JS 动画）的流畅性。

### Debug 与 Release 的区别

- **Release 模式**（`NDEBUG` 已定义）：  
  自动启用 `Accelerated2dCanvasEnabled` 和 `WebGLEnabled`，所有网页渲染由 GPU 分担，性能最优。

- **Debug 模式**（`NDEBUG` 未定义）：  
  **硬件加速被强制禁用**，所有渲染回退到 CPU 软件模拟。这会导致页面卡顿、帧率明显下降，尤其当页面包含复杂 JS 动画时。

上述行为在 `main.cpp` 中通过 `#ifdef NDEBUG` 控制。**这是设计如此**，目的是避免 GPU 进程干扰调试器（断点、单步执行等）。

### 对贡献者的建议

1. **日常开发和性能测试**：请始终使用 **Release 模式** 编译运行（例如 `cmake --build build --config Release`）。  
   如果你需要调试页面逻辑，可以开启日志输出（`app.debug=true`），Release 模式下的日志同样可用。

2. **如果你确实需要在 Debug 模式下验证页面行为**（例如排查偶现的 JS 错误）：  
   - 可以临时修改 `main.cpp`，将 `#ifdef NDEBUG` 改为 `#if 1` 强制开启硬件加速，但请注意这可能会使调试器无法正常捕获 GPU 进程的异常。  
   - 或者改用 Release 模式 + 附加调试器（如 VS 的“附加到进程”）。

3. **未来计划**：  
   当硬件加速不可用（Debug 模式或用户电脑缺少必要驱动）时，程序将能够自动检测并**降低动画帧率、禁用部分特效**，以缓解卡顿感。目前这一优化尚未实现，欢迎贡献者提交相关实现（例如通过 `QWebEngineSettings::setAttribute` 动态调整，或在网页端通过 JS 检测 `navigator.hardwareConcurrency` 等因素降级）。

### 提交 PR 时的注意事项

- 如果你修改了任何与 `QWebEngineSettings` 或 GPU 初始化的代码，请在 PR 描述中说明测试时使用的构建模式（Release / Debug），并确保 Release 下性能无明显退化。
- 如果你增加了对无硬件加速环境的降级逻辑（如 JS 侧检测并禁用部分动画），请同时更新相关文档或注释。

## 文档贡献

文档（`README.md`、`CodingStyle.md`、`CONTRIBUTING.md` 等）的改进同样欢迎。请遵循与代码相同的 PR 流程，并在 `docs` 类型的 commit 中注明。

## 获取帮助

如果你不确定如何开始，可以在 Issue 中提问，或通过作者联系方式（见 README）询问。

再次感谢你的贡献！
