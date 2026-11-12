# Super Agent on dev

The workspace supervisor follows the DeepSeek Harness research prototype's separation of intake, attention and execution. TeamFlow owns workflow execution and all human decisions.

| DeepSeek implementation | TeamFlow implementation |
| --- | --- |
| [Intake.receive](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/6337fc823ce20251c8de8085948165c81aaa701e/src/core/intake.ts) checks source scope and resolves subscriptions before dispatch. | A workspace index discovers only explicitly subscribed team IDs for normal reads. The settings picker enumerates available workflows on demand. The team record owns its subscription. |
| [reportRelay](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/6337fc823ce20251c8de8085948165c81aaa701e/src/app/notices.ts) filters routine progress and gives a human question a stable identity. | Pending proposals use their proposal ID. Checkpoints use task, run and round. Configuration, rerun, returned review and paused-loop blockers retain their reason. Restoring a Web tab derives open items from current persisted state. |
| [AgentDelivery](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/6337fc823ce20251c8de8085948165c81aaa701e/src/app/delivery.ts) checks request identity before delivering to a session. | A stable item identity groups repeated observations. Web reminder display is remembered per browser profile and workspace. The model reads current records when the user asks a question. |
| [Overview and navigation](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/6337fc823ce20251c8de8085948165c81aaa701e/src/client/app.tsx) expose a management panel, concrete records and the main session. | A separate sidebar entry opens the supervisor. A retained captain session hosts the original workbench for each reminder. One native read-only chat per workspace exposes the current watched-workflow query. |

Subscriptions default to off. Completing a workflow expires an ordinary subscription in the same persisted update, including while the browser is closed. An explicit keep setting retains it across reruns. A completed checkpoint within a continuing workflow removes only its resolved reminder. Approvals, plan changes and dispatch use the existing workflow controls.
