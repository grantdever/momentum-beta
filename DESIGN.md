# Design Constitution

Honest Streaks is a daily habit tracker built on one conviction: **it is a tool, not a game.** The streak is a record you keep, not a score you chase. Every decision here defends a calm, honest surface against the gamification patterns that make habit apps loud, anxious, or manipulative.

This document is the standard a change is measured against. If a proposed feature would make the app louder, more competitive, or more punishing, the answer is no — and the reason is written down so the conversation doesn't restart every time. When this document conflicts with implementer instinct, this document wins.

## Principles

- **Achievement framing, never loss framing.** A broken chain is described by what remains — days logged, best streak — never as failure. The word "again" and red "you lost it" states are out. Post-lapse disengagement is real (the what-the-hell effect, Cochran & Tesser 1996; the abstinence-violation effect, Marlatt), and the UI must not trigger it.
- **Off-days are free and unlimited.** A rest day is a first-class, un-costed state. There is no streak-freeze economy: a costed reserve solves an audience-pressure problem this app doesn't have (Sharif & Shu 2017's costly-reserve finding assumes an audience).
- **State is never encoded by color alone.** Every status — logged, off-day, weekly-target met — is legible through glyph, shape, or text as well as color (WCAG 1.4.11; colorblind users are not an afterthought).
- **Neutral description, never comparative judgment.** Per-habit counts are shown plainly, never ranked, never labeled "your worst habit," never surfaced as a comparison. The self-compassion literature supports neutral self-monitoring and warns against comparative shame.
- **Reminders trigger the recording ritual, not the habit.** A nudge to log is fine; a nudge engineered to create dependence is not.
- **Smallest version that delivers the value.** No new toggle, surface, or screen unless it carries its weight. Calm is a feature; every added control spends it.

## The do-not-add list

These are not open questions. Each has been evaluated and rejected, with the reason attached. Reopening one takes new evidence, not a new preference.

| Rejected | Why |
| --- | --- |
| Points / levels / XP | Overjustification risk — extrinsic reward can crowd out the intrinsic motive (Deci, Koestner & Ryan 1999; contested in magnitude, consistent in direction). |
| Social feeds / leaderboards | An implied audience creates misreporting pressure, especially on private habits. |
| Variable / intermittent rewards | This is the slot-machine compulsion loop. A habit tool must not build one. |
| Mascots or guilt characters | Manufactured emotional pressure; contradicts the no-guilt constraint outright. |
| Red failure states | Loss framing — see "achievement framing" above. |
| Milestone confetti / badges / shareables | Celebration motion turns a private record into a performance. |
| Costed streak-freeze economy | Solves an audience problem that doesn't exist here; off-days are already free. |
| A habit-strength score replacing the streak number | Legibility regression — an opaque computed score (e.g. a Loop-style moving average) is less honest than a plain count against a stated threshold. |

## Validated as-is (defend against churn)

Correct decisions, worth defending against well-meaning revision:

- **Dots, not a ring, for a discrete weekly quota** — the Apple-HIG-correct form for a small countable target.
- **A fixed color ramp for intensity** — adaptive quartiles solve an unbounded-scale problem this app doesn't have.
- **A weekday-aligned history grid** (columns = weeks, rows = weekdays) — makes real patterns ("I always skip Fridays") visible; a chronological wrap does not.
- **Redundant state encoding** (checkmark glyph + hatch + corner marker) — so status never rides on color alone.

## Using this document in review

Before proposing a change, check it against the do-not-add list and the principles. If it survives, it still has to earn its place against the app's calm. A pull request that adds a competitive, celebratory, or guilt-inducing surface should expect to be closed with a link to the relevant row above — that is the document working as intended.
