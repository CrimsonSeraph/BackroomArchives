# 配置文件目录（config）

本目录存放 BackroomArchives 的全部系统配置内容。客户端启动时会自动加载本目录下的 JSON 配置文件，并通过优先级规则合并为最终配置。

---

## 配置文件优先级

客户端支持多配置文件管理，按优先级从低到高依次为: 

| 文件名 | 优先级 (`__priority`) | 作用说明 |
| - | - | - |
| `main.json` | 0 | 核心应用配置 |
| `user.json` | 1 | 用户自定义样式配置 |

**覆盖规则**: 当多个文件中存在相同路径的配置项时，优先级高的文件中的值会覆盖优先级低的文件中的值。

所有配置文件必须包含以下固定字段: 
- `"__priority"`: 用于定义优先级（不可删除，值需与文件名对应）。
- `"version"`: 默认版本号为 `"1.0"`。
- `"BackroomArchives"`: 固定为 `"BackroomArchives"`，用于识别配置文件归属。

---

## 配置文件详解

### 1. `main.json` —— 核心应用配置

该文件控制客户端的基础行为，包括应用信息、调试选项、日志级别、Python 脚本路径等。

#### 字段说明
| 路径 | 类型 | 说明 |
| - | - | - |
| `app.name` | string | 应用名称（显示在窗口标题等位置） |
| `app.version` | string | 应用版本号 |
| `app.debug` | bool | 是否开启调试模式（Windows 下会创建调试控制台） |
| `app.log.console_level` | int | 控制台日志输出等级: 0-DEBUG / 1-INFO / 2-WARN / 3-ERROR / 4-NONE |
| `app.log.only_type_info` | bool | 是否仅输出单个类型的日志（用于精简输出） |

---

### 2. `user.json` —— 用户自定义样式配置

该文件用于存储用户的个性化设置，例如字体大小等。例如: 

```json
{
    "__priority": 1,
    "app": {
    },
    "version": "1.0",
    "BackroomArchives": "BackroomArchives"
}
```

这些设置会覆盖 `main.json` 和 `system.json` 中的同名项（若存在）。

---

## 注意事项

- 配置文件必须为合法的 JSON 格式，否则客户端将无法解析。
- 修改配置文件后，客户端通常支持热重载（部分模块需重新加载配置）。
- 如果某个文件缺失，客户端可能无法正常工作，请务必保留两个文件以确保配置完整性。
- 请勿删除或修改 `__priority`、`version`、`BackroomArchives` 这三个保留字段。
