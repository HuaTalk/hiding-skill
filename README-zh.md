# /hiding — 清理文件中的 AI 泄露痕迹

一个 Claude Code 插件，在提交、推送或分享前移除文件中的 AI 生成残留内容。

## 功能

`/hiding` 让文件读起来像是人类编写的——没有 AI 推理痕迹，没有规则引用，没有自我指涉，没有泄露的凭证。

**作用域**：仅作用于文件（代码、配置、markdown、文档）。不修改 agent 的对话回复。

## 五种泄露模式

| 模式 | 检测内容 |
|------|---------|
| **S** 机密 | API 密钥、token、密码、连接字符串、内部 URL |
| **R** 规则 | 引用 CLAUDE.md、skill 指令、读者不具备的团队约定 |
| **C** 约束 | "不能用 X 因为团队规范要求用 Y"、针对 AI 约束的推理说明 |
| **A** AI 自我指涉 | "作为 AI…"、"我认为…"、"以下是结果："、"希望对你有帮助！" |
| **T** 思维推导 | 逐步推理、带日期的进度记录、调研发现、设计理由追溯 |

## 用法

```bash
/hiding                       # 会话感知 HITL —— 分析、建议、用户决策
/hiding <文件路径>              # 清理指定文件
/hiding <描述>                  # 按描述隐藏匹配内容（如 "/hiding mock数据"）
```

## 安装

### 推荐：通过 npx skills（支持 70+ 代理）

```bash
npx skills add HuaTalk/hiding-skill
```

一条命令安装到所有编码代理（Claude Code、Codex、Cursor、Windsurf、Gemini CLI、Copilot、Cline 等）。

### Claude Code（原生插件）

```
/plugin marketplace add https://github.com/HuaTalk/hiding-skill.git
```
```
/plugin install hiding@hiding
```
（需要分两次发送这两个命令才能完成安装）

重启 Claude Code。`/hiding` 命令即就绪。

升级：`/plugin update hiding@hiding` + 重启。

### npm（配合 skills-npm 使用）

```bash
npm install -D @huatalk/hiding-skill
npx skills-npm setup
```

### 卸载

| 方式 | 命令 |
|------|------|
| npx skills | `npx skills remove hiding` |
| Claude Code | `/plugin remove hiding` |

## 设计哲学

`/hiding` 是一个**事后清理**工具，而非实时行为约束。它不在 agent 会话上下文中注入规则，而是让模型自然工作，然后在最后一步统一处理。这样做保留了推理质量，并且遵循了静默执行原则——`/hiding` 执行后，没人能察觉它执行过。

详见 [设计取舍：事后清理而非实时约束](docs/design-tradeoffs-zh.md)。

## 执行保证

- **默认静默** — `/hiding` 执行后，没人能察觉它执行过。无标记、无公告、无副作用。
- **代码逻辑绝不修改** — 只剥离注释和叙述性文本。
- **结构安全** — 清理后验证大括号、JSON、YAML、markdown 结构完整性。
- **删除需确认** — 文件级删除候选项需要用户确认后才执行。

## 版本

当前：**0.5.0** —— 会话感知 HITL 模式，五种泄露模式检测，文件级删除检查。

## 许可证

[MIT](LICENSE)
