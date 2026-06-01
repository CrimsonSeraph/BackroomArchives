# 页面目录 (pages)

本目录包含游戏前端的所有静态资源（HTML、CSS、JavaScript）以及第三方扩展库。

## 文件结构

| 文件 / 目录 | 描述 |
| - | - |
| `index.html` | 游戏主页面，定义了档案馆风格的 UI 布局，并集成了 `DynamicTextEngine` 实现的动态文本特效（渐变标语、抖动状态、乱码备忘录等）。 |
| `style.css` | 主样式表，提供复古 CRT 氛围、玻璃态面板、按钮交互及响应式布局。 |
| `script.js` | 页面交互脚本：初始化 `BackroomsAPI`（与 C++ 后端通信），绑定按钮事件，并调用 `js_log` 输出调试信息。 |
| `backrooms-sdk.js` | 前端 SDK，封装了与 C++ 桥接对象（`GameState`、`InputHandler`、`JsConsole`）的通信，提供 Promise 风格的 API 和事件监听机制。 |

## DynamicTextEngine 在本项目中的应用

- **标题渐变**：`.game-title` 配合 `data-glow` 与 CSS 渐变为游戏名称营造神秘感。
- **动态标语**：`.dynamic-slogan` 使用 `changing-color` 实现多色循环。
- **现实稳定性数值**：`.stat-warning` 内的 `.shake-individual` 让每个数字独立抖动，并通过 `text-switch` 组件轮播不同阈值。
- **加密备忘录**：`.obfuscated-text` 将普通文本转换为随机乱码，模拟 M.E.G. 加密文档。

所有特效均通过 HTML 属性声明，无需额外编写 JS 控制代码，便于维护和扩展。

## 开发与调试

- 确保 `extensions/qwebchannel.js` 已由 CMake 构建脚本从 Qt 安装目录复制到输出目录。
- 页面加载后，`script.js` 会创建 `BackroomsAPI` 实例并等待 C++ 后端就绪，成功后绑定按钮事件。
- 所有来自 C++ 的事件（如 `game_start`）会通过 SDK 的 `on` 方法触发 UI 更新或进一步交互。

> 有关 `DynamicTextEngine` 的详细配置参数，请参阅 **[DynamicTextEngine](https://github.com/CrimsonSeraph/WebUtils/tree/main/DynamicTextEngine/README.md)**。
