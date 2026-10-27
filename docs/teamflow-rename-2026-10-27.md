# DSH TeamFlow 改名与安装

项目从 AgentTeams 开发分支改名为 **DSH TeamFlow**，与上游原版区分。

| 项目 | 新值 |
| --- | --- |
| GitHub | https://github.com/yogurtss/dsh-teamflow |
| 安装包 | `@yogurtss/dsh-teamflow` |
| 主命令 | `/teamflow` |
| 插件配置 ID | `teamflow` |
| 诊断命令 | `dsh-teamflow-doctor` |

尚未发布到 npm，请使用 GitHub 或构建的 tgz 安装。版本暂保留 `0.1.27`，包名与来源才是区分原版的依据。保留上游 MIT 许可证和作者归属。

## 安装

先停止目标 profile 的 DSH。若仍安装着旧插件，执行：

```sh
dsh plugin --profile web remove @nanmicoder/dsh-agent-teams
```

然后安装新项目并启动：

```sh
dsh plugin --profile web add github:yogurtss/dsh-teamflow#main
dsh --profile web
```

将 `web` 换成实际 profile。桌面端可在插件管理页添加 `https://github.com/yogurtss/dsh-teamflow`，完成后重启。不要同时启用原版和 TeamFlow。

本次按用户要求已卸载这台电脑 `web`、`desktop` profile 中的旧包；没有向这两个 profile 自动安装 TeamFlow。其他插件、源码和工作区团队记录保留。

## 保留的数据与协议

- `.agent-teams/` 仍为默认团队数据目录，不需要改名或删除。
- `/agent-teams` 及已有 profile 命令继续兼容，新命令为 `/teamflow`、`/teamflow-<profile>`。
- 内部工具 `agent_teams_*`、消息来源类型和会话卡片协议保留，避免旧会话和记录失效。
- 旧自定义插件配置需把配置节点 ID 从 `agent-teams` 对应到新节点 `teamflow`，再恢复自己的配置值；卸载包不会自动迁移自定义配置。
- 历史测试报告、截图和上游发布说明保留当时名称。最新安装方式以项目 README 为准。
- 本地源码目录仍为 `G:\dsh_agents`；Git 的 `origin` 已更新到新仓库。

## 验证

Windows 构建、打包及构建产物一致性检查通过；WSL 隔离环境完整 `pnpm verify` 通过，包含新旧命令注册与解析回归检查；包身份、诊断、README 和旧宿主来源兼容相关的 18 项定向测试通过。按用户要求未重新安装到日常 DSH profile，因此不将本次改名描述为新的真实模型端到端验收。
