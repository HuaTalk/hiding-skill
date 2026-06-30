# 路线图

`/hiding` 技能的后续改进项，按 ROI 排列。

## #1 — CI 校验 + Pre-commit Hook

**问题**：插件分发给消费者使用 —— 路径错误、frontmatter 缺失（`name` / `description` 必填）、JSON 格式非法等问题当前无自动化检查。

**落地动作**：
- `scripts/check.sh`：
  - 校验 `skills/hiding/SKILL.md` frontmatter（`name` / `description` 必填）
  - 校验 `.claude-plugin/*.json` JSON 合法性
  - 凭证泄露扫描（`ghp_`、`sk-` 等模式）
- GitHub Actions：PR 触发自动跑 `check.sh`
- Pre-commit hook：本地提交前跑，拦截低级错误

## #2 — 版本发布与 Changelog

**问题**：消费者通过 `/plugin update hiding@hiding` 升级，但没有 changelog 告知改了什么、是否 breaking。`plugin.json` 版本号需与 git tag 保持同步。

**落地动作**：
- `CHANGELOG.md`：语义化版本，每个 release 列出 Added / Changed / Removed / Fixed
- `plugin.json` 版本号与 git tag 同步
- Release 流程文档（打 tag → 写 changelog → 通知消费者）

## #3 — 社区贡献指南

**问题**：开源后外部贡献者不知道如何提 PR、skill 设计哲学是什么。

**落地动作**：
- `CONTRIBUTING.md`：PR 流程、skill 设计哲学（"静默执行"）、review 标准
- Issue 模板（bug report / feature request）

## #4 — Git Pre-commit Hook 集成

**问题**：用户需要记住在提交前运行 `/hiding`。pre-commit hook 可自动检测 AI 泄露并提示。

**落地动作**：
- `hooks/pre-commit`：扫描暂存文件中的模式 A/T 泄露，发现时警告
- 通过 `scripts/install-hooks.sh` 选择性安装
- 绝不自动 strip —— 提交前始终 HITL

## #5 — 触发匹配验证

**问题**：skill 的 `description` 字段是 dispatcher 的唯一匹配面。缩减关键词后可能丢召回，但当前无法自动化验证。

**落地动作**：
- `scripts/test-triggers.sh`：列出预设触发短语，模拟匹配，报告未命中
- 不追求 100% 覆盖率 —— 重点覆盖高频触发词
- 作为 #1 CI 流程的可选步骤（允许部分未命中，不阻塞 PR）

## 已完成

- ~~移除中文 skill 维护~~：删除 SKILL-zh.md；双语触发词保留在 SKILL.md `description` 中。中文内容仅为文档 —— 2026-06-30
- ~~独立仓库抽离~~：从多 skill 框架中抽取 hiding skill 为独立插件仓库 —— 2026-06-30
- ~~会话感知 HITL 模式~~：无参数 `/hiding` 分析会话上下文并呈现泄露发现 —— v0.5.0
- ~~五种泄露模式检测 (S/R/C/A/T)~~：全面覆盖机密、规则泄露、约束链条、AI 自我指涉、思维推导 —— v0.5.0
- ~~文件级删除检查~~：量化阈值（剩余 < 20%）识别 AI 思维过程文件 —— v0.5.0
