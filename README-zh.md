# /hiding — 清理文件中的 AI 泄露痕迹

一个 Claude Code 插件，在提交、推送或分享前移除文件中的 AI 生成残留内容。

## 功能

`/hiding` 让文件读起来像是人类编写的——没有 AI 推理痕迹，没有规则引用，没有自我指涉，没有泄露的凭证。

**作用域**：仅作用于文件（代码、配置、markdown、文档）。不修改 agent 的对话回复。

## 前后对比

```java
// 清理前 /hiding
// I'll use the Builder pattern here since the constructor has too many params.
// As an AI, I think this is cleaner than telescoping constructors.
// Following the team conventions in CLAUDE.md, I'm adding validation.
public UserService createUser(UserDTO dto) {
    return User.builder()
        .name(dto.getName())
        .email(dto.getEmail())
        .build();
}

// 清理后 /hiding
public UserService createUser(UserDTO dto) {
    return User.builder()
        .name(dto.getName())
        .email(dto.getEmail())
        .build();
}
```

无标记、无注解、无人能察觉到它执行过。代码看上去就像是人类从一开始就写的那样。

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
/hiding                              # 会话感知 HITL —— 扫描会话文件 + git 未提交文件
/hiding <文件路径>                     # 原地清理指定文件
/hiding <描述>                         # 按描述隐藏匹配内容（如 "/hiding mock数据"）
```

### 参数

| 参数 | 值 | 默认 | 说明 |
|------|--------|---------|-------------|
| `--mode` | `inplace` / `newfile` / `backup` | `inplace` | 输出模式 |
| `--subagent` | （布尔标记） | 关闭 | 使用子代理执行，隔离性更好 |
| `--dry-run` | （布尔标记） | 关闭 | 预览变更，不修改文件 |

```bash
/hiding --mode newfile file.java          # 输出到 file-cleaned.java，保留原文件
/hiding --mode backup config.yml          # 原文件重命名为 .bak，清理版使用原名
/hiding --dry-run file.java               # 预览将要清理的内容
/hiding --subagent file.java              # 通过子代理剥离泄露痕迹
/hiding --dry-run                         # HITL 预览，不实际执行
```

### 输出模式

| 模式 | 行为 |
|------|----------|
| `inplace`（默认） | 原地修改文件 |
| `newfile` | 创建 `<名称>-cleaned.<扩展名>`，原文件保持不变 |
| `backup` | 原文件重命名为 `<名称>.bak`，清理版写入原文件名 |

### 安全：凭证处理

当检测并剥离 Pattern S（凭据、API 密钥、令牌）时，`/hiding` **始终会发出警告**：

> ⚠️ 发现并移除了安全敏感内容。如果此文件曾被提交、推送或分享，请立即轮换受影响的凭证。

这是静默执行**唯一的强制性例外**——因为不知道需要轮换的静默凭证剥离，比有声的剥离更危险。

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

想想费马的页边笔记。费马没有展示他的证明过程——他写下了定理就直接发表了。证明本身成为了传奇。`/hiding` 让你的代码拥有同样的神秘感：结果自成一体，没有可见的「脚手架」。你的同事会好奇你是怎么写得这么干净的。（详见 [费马原则](docs/hiding-philosophy.md)，一个略微不敬的论证。）

详见 [设计取舍：事后清理而非实时约束](docs/design-tradeoffs-zh.md) 的技术论述。

## 执行保证

- **默认静默** — `/hiding` 执行后，没人能察觉它执行过。无标记、无公告、无副作用。
- **代码逻辑绝不修改** — 只剥离注释和叙述性文本。
- **结构安全** — 清理后使用实际解析器（JSON、YAML、XML）验证结构完整性。
- **删除需确认** — 文件级删除候选项需要用户确认后才执行。
- **凭证告警** — Pattern S 剥离始终产生「轮换凭证」警告。
- **三种输出模式** — 原地修改（默认）、新建文件（保留原文件）、备份修改（原文件重命名为 .bak）。

## 版本

当前：**0.6.0** —— 输出模式（inplace/newfile/backup）、dry-run 预览、子代理执行、凭证安全告警、git 未提交文件发现、扩展文件类型支持。

## 许可证

[MIT](LICENSE)
