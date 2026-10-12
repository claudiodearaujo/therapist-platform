import { afterEach, vi } from 'vitest';

// Jasmine restored property spies between tests; preserve that isolation in Vitest.
afterEach(() => {
  vi.restoreAllMocks();
});
