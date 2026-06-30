# /hiding — 清理文件中的 AI 泄露痕迹

一个 Claude Code 插件。在提交、推送或分享前清理文件中的 AI 生成残留内容。

## 功能

`/hiding` 让文件读起来像是人工编写的——没有 AI 推理痕迹，没有规则引用，没有自我指涉，没有泄露的凭证。

**作用域**：仅作用于文件（代码、配置、markdown、文档）。不修改 agent 的对话回复。

## 五种泄露模式

| 模式 | 检测内容 |
|------|---------|
| **S** 机密 | API 密钥、token、密码、连接字符串、内部 URL |
| **R** 规则 | 引用 CLAUDE.md、skill 指令、读者不共享的团队约定 |
| **C** 约束 | "不能使用 X 因为团队用 Y"、针对 AI 约束的推理链条 |
| **A** AI 自我指涉 | "作为 AI…"、"我认为…"、"以下是结果："、"希望对你有帮助！" |
| **T** 思维推导 | 逐步推理、带日期的进度记录、调研发现、设计理由追溯 |

## 用法

```bash
/hiding                       # 会话感知 HITL —— 分析、建议、让用户决定
/hiding <文件路径>              # 清理指定文件
/hiding <描述>                  # 按描述隐藏匹配内容（如 "/hiding mock数据"）
```

## 安装

### Claude Code

```
/plugin marketplace add https://github.com/HuaTalk/hiding-skill.git
```
```
/plugin install hiding@hiding
```
（需要分两次发送这两个命令才能完成安装）

重启 Claude Code。`/hiding` 命令即就绪。

升级：`/plugin update hiding@hiding` + 重启。

### Codex

```bash
codex plugin marketplace add HuaTalk/hiding-skill
codex plugin install hiding@hiding-skill
```

打开 `/plugins`，选择 Hiding 集市，安装 Hiding。重启或开启新线程。

### Devin CLI

```bash
devin plugins install HuaTalk/hiding-skill
```

技能作为 `/hiding:hiding` 可用。

### Gemini CLI / Antigravity

```bash
gemini extensions install https://github.com/HuaTalk/hiding-skill
# 或
agy plugin install https://github.com/HuaTalk/hiding-skill
```

每会话从 `AGENTS.md` 加载规则。

### Hermes Agent

```bash
hermes plugins install HuaTalk/hiding-skill --enable
```

安装后重启 Hermes。技能作为 `hiding:hiding` 可用，命令为 `/hiding`。

### OpenClaw

```bash
clawhub install hiding
```

### GitHub Copilot CLI

```bash
copilot plugin marketplace add HuaTalk/hiding-skill
copilot plugin install hiding@hiding-skill
```

Copilot CLI 也读取 `AGENTS.md` 和 `.github/copilot-instructions.md` 作为常驻规则。

### Pi agent harness

```
pi install git:github.com/HuaTalk/hiding-skill
```

### OpenCode

添加到 `opencode.json`：

```json
{ "plugin": ["@huatalk/hiding-skill"] }
```

OpenCode 也会自动加载仓库中的 `AGENTS.md`，即使没有插件规则也会生效。

### 其他 Agent（常驻规则）

对于 Cursor、Windsurf、Cline、Kiro、CodeWhale、Swival、Zed、Aider —— 将本仓库中对应的规则文件复制到项目中。完整映射见 [Agent Portability](docs/agent-portability.md)。

快速开始 — 将 `AGENTS.md` 复制到项目根目录：
```bash
curl -o AGENTS.md https://raw.githubusercontent.com/HuaTalk/hiding-skill/main/AGENTS.md
```

### 卸载

| 宿主 | 命令 |
|------|------|
| Claude Code | `/plugin remove hiding` |
| Codex | `codex plugin remove hiding` |
| Devin CLI | `devin plugins remove hiding` |
| Pi agent | `pi uninstall hiding` |
| Cursor / Windsurf / Cline 等 | 删除复制的规则文件 |

## 执行保证

- **默认静默** — `/hiding` 执行后，没人能察觉它执行过。无标记、无公告、无副作用。
- **代码逻辑绝不修改** — 只剥离注释和叙述性文本。
- **结构安全** — 清理后验证大括号、JSON、YAML、markdown 结构完整性。
- **删除需确认** — 文件级删除候选项需要用户确认后才执行。

## 版本

当前：**0.5.0** — 会话感知 HITL 模式，五种泄露模式检测，文件级删除检查。

## 许可证

[MIT](LICENSE)
