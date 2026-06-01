# 头文件目录 (include)

本目录包含项目的所有公共头文件（`.h` 及部分模板实现 `.hpp`），定义了配置管理、日志系统、控制台辅助等核心基础设施接口。  
所有代码均为纯 C++20，仅依赖标准库和 `nlohmann/json`（头文件库），不依赖 Qt、Python 等外部框架。

---

## 文件说明

| 文件名 | 描述 |
| ------ | ---- |
| `AppConfig.h` | 应用配置主类 `AppConfig`（单例）的声明。提供全局配置读写接口，支持多级配置（`main` / `user`）优先级合并、热重载、配置变更监听。内部集成 `MultiConfigManager` 实现配置管理。 |
| `AppConfig_impl.hpp` | `AppConfig` 的模板方法实现，包括 `get_value<T>`、`set_value<T>`、批量更新等模板函数。 |
| `AppConfig_utils.hpp` | 配置辅助工具类：`ConfigValue<T>` 用于简单类型配置项（带缓存和回调），`ConfigObject<T>` 用于复杂结构体配置（支持 JSON 序列化与验证），以及配置构建器、验证器等辅助工具。 |
| `BackroomArchives.h` | Qt 主窗口类 `BackroomArchives` 的声明，继承自 `QWidget`。负责界面初始化、按钮事件处理。 |
| `ConfigManager.h` | 单配置文件管理器 `ConfigManager` 的声明。封装 JSON 文件的加载、保存、键值访问（支持点分隔路径如 `"app.debug"`）、批量更新、删除及变更通知（观察者模式）。内部使用递归互斥锁保证线程安全。 |
| `ConfigManager_impl.hpp` | `ConfigManager` 的模板方法实现，提供 `get<T>`、`set<T>` 等类型安全的配置读写函数。 |
| `ConfigStructs.h` | 配置结构体定义。包含 `MainConfig`（游戏名称、版本、调试开关、日志等级等）和 `UserConfig`（玩家偏好，如最近档案版本、语言等）。每个结构体提供 `to_json` / `from_json` 静态方法和 `validate()` 验证方法。 |
| `Console.h` | Windows 控制台辅助类 `Console`（单例）的声明。用于在 GUI 程序启动时分配或附加调试控制台，设置 UTF‑8 代码页和字体，重定向标准流。非 Windows 平台为空实现。 |
| `DebugLog.h` | 日志系统核心类 `DebugLog`（单例）的声明。支持模块级日志等级过滤、多个输出接收器（sink，如控制台、文件），线程安全写入。提供宏 `LOG_MODULE` 用于统一格式的日志输出。 |
| `DebugLog_utils.hpp` | 日志辅助工具，包含 `DebugLogUtil` 命名空间下的字符串处理函数（如去除换行符、压缩空格等），便于日志格式化。 |
| `DefaultConfigs.h` | 默认配置工厂 `DefaultConfigs` 的声明。仅包含静态方法 `get_default_config(config_name)`，返回 `"main"` 或 `"user"` 对应的默认 JSON 配置，用于首次运行时生成配置文件。 |
| `GameStateBridge.h` | 游戏状态桥接类 `GameStateBridge` 的声明。继承 `QObject`，使用 `Q_OBJECT` 宏，暴露 `is_started` 和 `is_running` 属性（带 `NOTIFY` 信号），声明 `start_game`、`pause_game`、`resume_game`、`exit_game` 槽函数，以及 `running_changed`、`started_changed`、`game_event` 信号。用于与前端 JavaScript 通信游戏生命周期事件。 |
| `InputHandlerBridge.h` | 键盘输入桥接类 `InputHandlerBridge` 的声明。继承 `QObject`，声明槽函数 `handle_key_event`（接收键名、按下状态、修饰键 JSON），信号 `key_processed`（传递动作名称和数据），以及私有辅助方法 `map_key_to_action`（将按键映射为游戏动作）。 |
| `JsConsoleBridge.h` | JavaScript 控制台桥接类 `JsConsoleBridge` 的声明。继承 `QObject`，声明 `log(const QString& level, const QString& message)` 槽函数，用于接收来自 JS 的日志消息并在 C++ 端通过日志系统输出。 |
| `MultiConfigManager.h` | 多配置管理器 `MultiConfigManager`（单例）的声明。维护多个 `ConfigManager` 实例（如 `main`、`user`），支持按优先级（`__priority` 字段）排序，提供合并读取、优先级冲突检测、文件热重载等功能。 |
| `MultiConfigManager_impl.hpp` | `MultiConfigManager` 的模板方法实现，包括按优先级或按配置名称获取/设置配置值的模板函数，以及内部排序缓存的管理。 |
| `plugin_api/` | 插件接口目录（当前为空，待实现）。将包含 `ILevel.h`、`IBuff.h`、`ArchiveCore.h` 等接口定义，供档案插件使用。 |

---

## 依赖关系

- **nlohmann/json**：所有配置相关头文件（`AppConfig.h`、`ConfigManager.h`、`ConfigStructs.h` 等）依赖该 JSON 解析库。
- **C++20**：项目使用 C++20 标准，部分模板和概念要求编译器支持 C++20。

---

## 设计要点

### 1. 配置系统
- **多级配置**：通过 `MultiConfigManager` 管理 `main.json` 和 `user.json`，`user` 优先级高于 `main`，实现用户配置覆盖默认配置。
- **类型安全**：`ConfigValue<T>` 和 `ConfigObject<T>` 提供带缓存和变更回调的类型安全访问；`ConfigManager` 的模板方法 `get<T> / set<T>` 同样提供类型安全。
- **热重载**：`MultiConfigManager` 支持文件监控，配置文件修改后自动重新加载并通知监听器。
- **点分隔键路径**：支持 `"app.log.console_level"` 形式的路径，自动创建中间节点。

### 2. 日志系统
- **模块化过滤**：每个模块（如 `"AppConfig"`、`"PluginLoader"`）可独立设置日志等级；支持“仅输出指定等级”模式。
- **多接收器**：可注册多个 `LogSink`（控制台、文件等），每个接收器有独立最低等级，日志消息分发到所有符合条件的接收器。
- **线程安全**：所有日志操作均受互斥锁保护。

### 3. 控制台辅助
- **Windows 专用**：`Console` 类在 Windows 上创建独立调试控制台，设置 UTF‑8 编码、等宽字体，并重定向 `stdout`/`stderr`/`stdin`。其他平台无操作。

### 4. 线程安全
- 所有共享数据结构（配置缓存、日志等级表、监听器列表等）均使用 `std::mutex`、`std::recursive_mutex` 或 `std::atomic` 保护，确保多线程环境下的正确性。

---

## 使用示例

### 初始化配置系统
```cpp
#include "AppConfig.h"

// 在程序启动时调用
if (!AppConfig::instance().initialize("./config")) {
    // 初始化失败，但程序可继续运行（使用内存默认配置）
}
```

### 读写配置
```cpp
// 读取配置（带默认值）
bool debug = AppConfig::instance().get_value("app.debug", false);
std::string archive = AppConfig::instance().get_value("game.active_archive", "");

// 写入配置（写入优先级最高的配置文件，即 user.json）
AppConfig::instance().set_value("game.active_archive", "wikidot");
AppConfig::instance().save_all();   // 可选，自动保存
```

### 输出日志
```cpp
#include "DebugLog.h"

LOG_MODULE("GameCore", "load_level", LOG_INFO, "Loading level: " << level_name);
LOG_MODULE("PluginLoader", "load_plugin", LOG_ERROR, "Failed to load plugin: " << path);
```

### 注册配置变更监听
```cpp
AppConfig::instance().add_config_listener("main", [](){
    // 主配置变更时执行操作
});
```

---

## 注意事项

- 所有 `*_impl.hpp` 文件会被对应的 `.h` 文件在末尾包含，无需手动引入。
- 多线程环境下，使用 `AppConfig::instance().get_value(...)` 等线程安全方法，内部已加锁。
- 配置文件中的 `__priority` 字段用于多级配置优先级，请勿手动删除或修改。
- 日志等级定义：`LOG_DEBUG`(0)、`LOG_INFO`(1)、`LOG_WARN`(2)、`LOG_ERROR`(3)、`LOG_NONE`(4)。
