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
