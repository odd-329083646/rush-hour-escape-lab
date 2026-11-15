# Lobby results and global level numbering
- [x] Hide stale competition results on lobby entry without resetting achievements; verified with a real expired friend room and repeat polling tests.
- [x] Number stages continuously across tiers; verified all 246 stage labels in the browser and 52 regression tests.

# Red-car winning exit
- [x] Restore the visible red-car escape before victory covers the board, including daily games and hidden-car modes; verified desktop Easy and mobile Hard/Murderer solves, next-level reset, and 27 regression tests.

# Competitions matchmaking update
- [x] Replace lobby actions with random/friend choices and add a matched-player VS introduction.
- [x] Enforce a 60-second random search, direct cancellation, and distinct unavailable-room/timeout screens.
- [x] Add capability-verified friend invitations with app-wide notifications; verify two real guests and responsive layouts.

# Daily gameplay alignment
- [x] Center car IDs and restore Cars/Trucks selection.
- [x] Add bounded mouse/touch dragging and keyboard selection/execution.
- [x] Verify both daily routes and run gameplay regression tests.

# Expanded hints
- [x] Add shared hint selection and coin pricing to regular and daily games.
- [x] Add timed peek, permanent single-car reveal, and penalty-free plan validation.
- [x] Test hint rules and verify gameplay in the browser.

# Starting-board peek
- [x] Remove the header's Show Cars toggle.
- [x] Preview original positions for three seconds in regular and daily games without changing progress.
- [x] Verify hint prices, mode availability, and starting-board restoration.
# Tutorial
- [x] /tutorial with 4 lessons, linked from Home and Settings, 50-coin first-completion reward.
- [x] Add initial language choice, standard gameplay layout and pointer/keyboard controls; verify all lessons and reward.
- [x] Limit language setup to first visits, show lesson intro modals, and auto-advance on escape; verify navigation and reward.

# Live 1v1 tournaments
- [x] Use device-based guests without registration, six-digit friend room codes, and a one-time existing-coin import.
- [x] Add 50-coin entry, random matchmaking with a 15-second bot fallback, and private rooms with 30-second refunds.
- [x] Add synchronized countdown, three shared puzzles, live opponent progress, and first-finisher results.
- [x] Award 90 coins to the winner once, record win/loss stats, and verify two-player and bot flows.

# Three-tier architecture
- [x] Centralize device persistence, puzzle loading, database access, and Realtime in services.
- [x] Extract game and reward engines and mode-specific hooks; keep screens presentation-only.
- [x] Apply tournament moves locally and serialize background synchronization without blocking gestures.
- [x] Verify storage/reward/movement regressions, delayed-network gameplay, and existing modes.

# Tournament puzzle indices
- [x] Send three server-selected indices from a stable shared catalogue instead of puzzle objects.
- [x] Update match storage, local resolution, and server move validation.
- [x] Run regression tests and verify two guests receive identical boards.

# Player Profile
- [x] Add Settings navigation, bilingual profile page, and modular racing avatars.
- [x] Persist validated profile edits and derived records locally; sync guest profiles in the background.
- [x] Show both players' avatars in races; test validation, records, persistence, and two-guest sync.

# Settings redesign
- [x] Simplify Settings and add the Home avatar shortcut.
- [x] Move country editing and difficulty records to Profile.
- [x] Persist reactive drag/keyboard switches across all boards; test and verify.

# Toy-style visual redesign
- [x] Use the uploaded backgrounds at the requested screen-width breakpoint.
- [x] Restyle Home and shared controls/panels without changing gameplay.
- [x] Verify mobile, tablet, desktop, Hebrew, and game navigation.

# Vibrant toy UI
- [x] Add the uploaded logo and replace light panels/header bars with floating controls and indigo glass.
- [x] Restyle asphalt boards, difficulty colors, and full-screen golden victory celebrations.
- [x] Verify mobile/tablet/desktop screens and preserved gameplay interactions.

# Exact palette and logo proportions
- [x] Preserve the logo's natural dimensions and centered placement.
- [x] Apply the requested board, glass, text, button and dark-overlay colors through shared tokens.
- [x] Verify phone/tablet/desktop layout, popups and gameplay without changing game rules.

# Visual consistency
- [x] Restore the complete logo and remove its checkerboard background.
- [x] Unify asphalt panels, title badges, navigation, profile/settings controls, difficulty tiles and gold stars.
- [x] Verify desktop/mobile screens and gameplay without changing rules.

# Direct page loading
- [x] Diagnose hosted errors on direct links and refreshes without adding hosting rewrite files.
- [x] Inline server imports to avoid the hosted CommonJS initialization failure; verify config loading, 17 routing tests, and all local pages in new tabs and on refresh.
- [ ] Verify published direct pages after deployment; the last live check still returned the CommonJS initialization error.

# Compilation and styling recovery
- [x] Fix public-asset imports and stylesheet import ordering without changing puzzles or gameplay.
- [x] Run regression tests and verify styled pages, direct loading and refresh in preview.
- [ ] Deploy the fixes and verify the published pages and styles; publishing requested, but the last live check still returned HTTP 500.
