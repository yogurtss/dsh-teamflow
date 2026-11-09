# Task adaptation progress

The workflow dialog keeps an adaptation status and return button above its page tabs' content. Opening a discussion immediately shows connection progress. Host busy state drives generation progress; an idle session without a proposal is shown as awaiting further discussion, not successful completion.

Returning to an existing discussion does not submit another generation request. Navigation remains available while conflicting edits and starting the workflow are disabled. Completion preserves the currently selected page. Proposals still require explicit confirmation, and outdated proposals are identified separately from connection failures.

Validation:
- 'node --test scripts/adaptation-progress.test.mjs' covers state precedence and translations.
- Start 'scripts/workflow-preview.mjs' with 'TEAMFLOW_PREVIEW_DISCUSSION=1', then run 'scripts/adaptation-progress-browser.mjs'. Configure 'TEAMFLOW_ADAPTATION_URL', 'TEAMFLOW_PLAYWRIGHT_MODULE' and 'TEAMFLOW_BROWSER_CHANNEL' as needed.
- The browser test uses simulated host responses and no model calls. It checks slow opening, duplicate clicks, navigation, operation locking, completion without focus theft, disconnection/reconnection, and restoring the discussion after reload.

This stable backport preserves the original workflow scope: no gated loops, result-archive nodes, or branch-based human rework.
