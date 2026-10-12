# Dependency security maintenance — 2026-10-12

## Changes

- Backend development and seed scripts use `tsx` 4.23.15. Removing `ts-node-dev` removes its Chokidar 3 / braces chain (GHSA-vfj7-8cjw-p6xm).
- Jest remains on compatible 30.x; ts-jest is pinned to 29.4.14, whose peer range supports Jest 30. Test discovery uses relative globs to also work in Windows paths containing dot directories.
- `js-yaml` is overridden to 4.3.2. The installed Istanbul config loader calls `load`, which remains available; a YAML configuration with `extends` was verified. This removes argparse 1 / sprintf-js (GHSA-hp3w-g68c-fv3c). Coverage and backend builds must remain green.
- Frontend retains Angular 20.3.32 and the Angular 20 application builder. The 36 spec files remain in place; Jasmine spies, assertions and fakeAsync timers are adapted to Vitest. Property spies are restored after each test.
- Karma and its unused config are removed after migrating its consumers. `postcss-cli` had no active consumers; Angular continues to process `.postcssrc.json` through its build pipeline.
- Vitest is pinned to 4.1.11: the Angular 20 optional peer range still names Vitest 3, which has known mocker and Tinypool advisories. The narrow `@angular/build` peer override selects the patched runner; this is supported here only for the configured jsdom mode and is validated by the complete suite. Browser mode/coverage runner upgrades require separate verification. The Angular 20 unit-test builder itself remains experimental.
- Frontend installation uses plain `npm ci`, without ignoring peer resolution. Both lockfiles are committed.

## Required verification

Run clean `npm ci`, builds, TypeScript, complete unit suites and `npm audit` in backend/frontend. `npm ls --all` must succeed. Security integration, SAST, root/e2e audits and GitGuardian remain enforced. Database integration tests run serially in the disposable CI PostgreSQL service; the fixture rejects missing explicit test configuration, remote hosts and database names without `_test` suffix. No test uses deployment credentials.

No audit severity threshold, protection rule or test exclusion was weakened. No application database was changed.

## References

- https://angular.dev/guide/testing/migrating-to-vitest
- https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
- https://github.com/advisories/GHSA-hp3w-g68c-fv3c
- https://github.com/advisories/GHSA-82fw-gwwq-j7x9
- https://github.com/advisories/GHSA-5gmw-xhrv-c9v3
- https://github.com/advisories/GHSA-85c8-ppgw-ccpr
