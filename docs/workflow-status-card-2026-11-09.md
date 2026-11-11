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

画布节点使用 294 × 230 像素的卡片。顶部显示成员与状态，中间展示任务名称和要求，底部显示实际记录、阻塞信息或待处理事项。悬停、聚焦或选中节点时可使用节点控制。画布显示坐标与持久化布局通过比例换算。
