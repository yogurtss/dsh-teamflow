# Larger Workflow status card

The top-right collapsed Workflow status surface is now a 300px-wide card with
automatic height, capped to its containing surface. It displays the team name,
state, completion percentage, and the existing completed/running/review/attention
summary without requiring hover. Long names wrap to two lines; summary text wraps
on narrow surfaces. Theme colors, reduced-motion support, keyboard focus, owner
filtering, and click-to-open-canvas behavior are preserved.

This updates `CollapsedBadge`, not the conversation summary or canvas task nodes.
Completion still comes from `activityStatus`, including its approved-checkpoint
rule. No execution or workflow-state behavior changes.

Validation: both TypeScript projects and browser bundle built successfully;
11 activity-status/navigation regression tests passed. Git artifact stamps are
regenerated separately on dev and main to keep development-only loop features
out of this stable card update. No interactive browser visual verification.

The development build also shows the active agent in the collapsed card and conversation summary. Live execution uses a blue pulse and Captain adaptation uses purple. Completion, blocked work and decisions use distinct green, red and amber marks. Reduced-motion mode keeps the marks static. Parallel work and handoffs display the corresponding member names.
