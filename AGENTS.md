<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Both daily routes use the shared DailyGame screen and finalize pointer, keyboard, and button moves through applyMove, keeping collision rules and daily scoring consistent.
- All UI text comes from src/lib/i18n.ts (useI18n); update document lang with the selected language while keeping document and hook direction LTR to decouple translation from layout geometry.
- The player profile (username, country) lives in src/lib/profile.ts on the device; stats are derived from saved level progress instead of being stored separately.
- Share hint pricing/availability through lib/hints and timed peek/charging through useHints; keep dry plan validation separate from gameplay state to prevent penalties or move commits.
- Render timed peeks from the initial puzzle snapshot, never the mutable gameplay board; block move commits during peek so starting-position previews cannot alter progress.
- Tutorial lessons reuse game-grid, board, controls and palette styles; pointer, keyboard and button actions share applyMove validation, while plan actions queue without committing until submission.
- Tutorial uses hydration-safe language/intro/play/completion phases; successful moves transition immediately, keeping dialogs separate from live lesson state.
- Guest tournaments use server-issued device capabilities hashed in private tables; server functions verify them before admin access, and an atomic SQL action arbitrates pairing, fees, refunds, and winners without account registration.
- Tournament Realtime channels carry data-free refresh notifications on random match topics; capability-verified state reads and polling recovery remain authoritative, and device coin deltas preserve existing offline earnings.
- Follow PL → BL → DAL: routes/components render hook outputs, hooks/engine own game policies, and services own device storage, repositories, database calls and Realtime; lib facades retain compatibility without owning implementations.
- Use a synchronous memory-backed game engine for moves and coalesced device writes for persistence; cold device reads and pagehide flushing preserve existing saves, while browser storage itself remains synchronous.
- Run expensive puzzle generation and BFS hint analysis in dedicated workers so they cannot stall pointer handlers; discard analysis results when their initial board has changed.
- Apply tournament moves optimistically and serialize their server validation in the background; reconcile authoritative snapshots plus pending moves, recover uncertain delivery without automatic replay, and never award a tournament win locally.
- Keep privileged tournament DAL helpers in server-only services dynamically loaded from validated server-function handlers; browser services must never import administrative clients.
