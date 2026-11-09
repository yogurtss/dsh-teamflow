# Conversation card restoration fix

Switching away from a conversation and returning can mount its closed-turn tail
before replay restores the team node. `TeamTurnCard` previously selected only
`snapshot.nodes`. The installed Harness chat package (0.2.1-rc.2) uses an
identity-stable mutable node store, so adding the restored node did not change
the selected value. The tail could remain empty while the closed-turn inline
renderer intentionally delegated its card to that tail.

Select the turn's cards inside `useChat`, with element-wise reference equality.
Replay, replacement, and removal now change the subscription value; unchanged
cards and updates to other turns do not. This uses the existing selector contract
and does not introduce a new host API or change persisted session data.

Validation:

- Built with the exact `build` script stages (clean, both TypeScript projects,
  tsdown, and artifact stamp). The pnpm launcher attempted an installation and
  hit sandbox symlink permissions, so the stages were invoked directly.
- 34 tests passed across client Harness migration, issue #203 cards, workspace
  activity, and loading regressions. The new test exercises the production
  component's selector and markup through delayed replay, update, unload, and
  return, while retaining the same node container.
- The new replay assertion fails against the previous implementation and passes
  against the fix.
- `node scripts/verify.mjs` passed, including Windows filesystem checks; it
  required normal permissions because the sandbox blocked a temporary rename.
- Git artifact verification passed. No interactive browser validation was run.

The user explicitly requested synchronization to both `dev` and `main`. Both
branches were equal at `a18f68f` before this fix; the promotion contains only this
fix, its regression coverage, documentation, and regenerated browser artifacts.
The package remains on the approved 0.2.7 baseline; `classic` is unchanged.
