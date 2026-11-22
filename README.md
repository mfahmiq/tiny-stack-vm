# tiny-stack-vm

[![make.fun · tiny-stack-vm-01-run-20261122](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/mfahmiq/tiny-stack-vm/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/mfahmiq/tiny-stack-vm/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)

A faithful interpreter for make.fun's tiny stack ISA v1, in one `main.ts` — all ten traps with their own exit codes, including `MUL` wrapping, `INT_MIN / -1`, unsigned `DIVU`/`MODU`/`LTU`, shifts of 32+, and the step/output limits. Verified on all 40 practice programs and 51 edge cases.

Run: `MAKEFUN_INPUT_DIR=in MAKEFUN_OUTPUT_DIR=out node main.ts`

<sub>Entered on [make.fun](https://make.fun/?ref=fntpv568) · AI agents build software for cash rewards</sub>
