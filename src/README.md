# 源代码目录 (src)

本目录包含项目的所有 C++ 源文件（`.cpp`），每个文件对应一个基础模块的实现。  
项目是一个**纯 C++20** 的文字游戏框架，采用插件化架构，本体仅提供配置管理、日志系统、控制台辅助和插件加载能力（插件加载器尚未在此列出，属于游戏核心部分）。

---

## 文件说明

| 文件名 | 描述 |
| ------ | ---- |
| `AppConfig.cpp` | 应用配置主类（`AppConfig`）的实现，单例模式。负责配置系统的初始化、销毁、配置项读写（支持点分隔路径）、配置监听器管理，并集成 `MultiConfigManager` 实现多级配置（`main` / `user`）的优先级合并与热重载。为游戏本体和档案插件提供统一的配置访问接口。 |
| `BackroomArchives.cpp` | Qt 主窗口类（`BackroomArchives`）的实现，继承自 `QWidget`。负责界面初始化、按钮事件处理。 |
| `ConfigManager.cpp` | 单配置文件管理器（`ConfigManager`）的实现。封装 JSON 配置文件的加载、保存、键值访问（支持默认值）、批量更新（`merge_patch`）、删除指定键路径及变更通知（观察者模式）。内部使用递归互斥锁保证线程安全，并缓存键路径分割结果以提升性能。 |
| `ConfigStructs.cpp` | 配置结构体的定义与实现，包含 `MainConfig` 和 `UserConfig` 两个结构体。每个结构体均提供与 JSON 的相互转换（`to_json` / `from_json`）及基本的字段有效性验证（`validate`）方法，用于类型安全的配置访问。`MainConfig` 管理游戏名称、版本、调试开关、日志级别等；`UserConfig` 管理玩家偏好（如最近使用的档案版本、语言等）。 |
| `Console.cpp` | Windows 控制台辅助类（`Console`）的实现，单例模式。用于在 GUI 程序启动时分配或附加调试控制台，设置 UTF‑8 代码页、字体，并重定向 `stdout` / `stderr` / `stdin`，方便在图形界面之外输出日志信息（日志系统同时输出到文件和控制台）。非 Windows 平台下该功能为空操作。 |
| `DebugLog.cpp` | 日志系统核心实现（`DebugLog`），单例模式。支持模块级日志等级过滤、多个输出接收器（sink，如控制台、文件），线程安全的日志写入。提供便捷的宏 `LOG_MODULE` 用于统一格式的日志输出，便于调试游戏逻辑和插件运行状态。 |
| `DefaultConfigs.cpp` | 默认配置提供类（`DefaultConfigs`），静态方法 `get_default_config` 根据配置名称（`"main"`、`"user"`）返回对应的默认 JSON 配置，用于程序首次运行时生成配置文件。 |
| `GameStateBridge.cpp` | 游戏状态桥接类（`GameStateBridge`）的实现。继承 `QObject`，通过 `QWebChannel` 暴露给 JavaScript，提供游戏开始、暂停、恢复、退出等槽函数，并发射 `game_event` 信号通知 JS 游戏状态变化。内部记录游戏是否已启动（`m_is_started`）和是否正在运行（`m_is_running`），所有公共方法均输出调试日志。 |
| `InputHandlerBridge.cpp` | 键盘输入桥接类（`InputHandlerBridge`）的实现。接收 JS 传递的按键事件（键名、按下/释放状态、修饰键 JSON），解析后映射为游戏动作（如 `"pause"`），并通过 `key_processed` 信号将动作和数据回传给 JS。内部包含简单的按键映射表，可扩展。 |
| `JsConsoleBridge.cpp` | JavaScript 控制台桥接类（`JsConsoleBridge`）的实现。提供 `log(level, message)` 槽函数，供 JS 调用以输出调试信息。JS 传入的日志级别（`debug`/`info`/`warn`/`error`）被转换为 C++ 日志等级，最终通过 `LOG_MODULE` 宏输出到日志系统，模块名标记为 `"JavaScript"`，便于过滤。 |
| `MultiConfigManager.cpp` | 多配置管理器（`MultiConfigManager`）的实现，维护多个 `ConfigManager` 实例的注册表。支持按优先级（`__priority` 字段）排序配置，合并读取时优先级高的配置覆盖优先级低的配置；提供文件热重载功能（自动检测文件修改时间并重新加载）。用于实现 `main.json` 和 `user.json` 的优先级覆盖。 |

---

## 编译依赖

- **C++20** 或更高版本（需要支持 `std::filesystem`, `std::chrono`, `std::thread` 等）
- **nlohmann/json**（仅头文件，推荐 v3.11+）
- **CMake** 3.16+

---

## 设计要点

- **配置系统**：采用多级配置（`main`、`user`）与优先级合并，支持运行时动态修改与热重载，所有配置变更通过监听器通知上层模块。配置键路径支持点分隔（如 `"app.debug"`），自动创建中间节点。
- **日志系统**：支持模块粒度的日志等级控制，可注册多个接收器（控制台、文件等），便于调试与问题追踪。日志宏自动包含模块名、方法名和等级标签，格式统一。
- **线程安全**：所有共享数据结构均使用互斥锁（`std::mutex`、`std::recursive_mutex`）或原子变量保护，确保多线程环境（如文件热重载线程、主线程同时访问）下的正确性。
- **跨平台支持**：控制台创建 (`Console`) 仅在 Windows 生效；日志和控制台输出在其他平台使用标准 `std::cerr` / `std::cout`。文件操作使用 `std::filesystem` 确保跨平台一致性。
- **无外部 GUI 依赖**：项目本体为轻量级图形界面，但配置系统和日志系统完全独立，可在纯控制台模式下运行，便于调试和自动化测试。

---

## 与游戏框架的关系

这些文件构成了项目的基础设施层，为上层游戏核心和档案插件提供：
- 统一的配置读写 API（支持优先级覆盖和热重载）
- 灵活的日志输出（按模块和等级过滤）
- 调试控制台辅助（Windows）
