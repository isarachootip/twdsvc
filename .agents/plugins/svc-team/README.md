# svc-team plugin

Project plugin for the VService Repair System. It adds two agents and the two skills they use.

| Component | Type | Purpose |
|---|---|---|
| `trainer` | agent | Builds Thai training kits for each role under `docs/training/<role>/` |
| `tester` | agent | Runs `tsc --noEmit`, `npm test` and the unit tests not registered in the runner, then reports triaged failures |
| `role-training-kit` | skill | Procedure and templates used by `trainer` |
| `test-triage-report` | skill | Procedure and report template used by `tester` |

## Boundaries
- **trainer** writes only to `docs/training/`. It never edits the main manual or the code.
- **tester** never edits `src/`, `prisma/`, config or `.env*`. It may fix a test under `tests/` only when the test itself is wrong, and must justify the edit.

## Example prompts
- "Have trainer build a training kit for the GR role (new hire)"
- "Have tester run all tests and summarize the results"
- "Have tester run only tier 2 and analyze the tests that failed"

## Notes
- Restart Antigravity after first install so the plugin is discovered.
- `.gitignore` has an `!.agents/plugins/` exception so this folder can be committed.
