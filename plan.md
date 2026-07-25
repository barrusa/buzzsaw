1. **Extract `usePlayerName` custom hook in `src/App.tsx`**
   - Move the `playerMap` memoization and `getPlayerName` callback into a new `usePlayerName` hook.
   - This removes the code duplication and adheres to React's custom hook patterns.
2. **Refactor `HostWindow` and `BoardWindow`**
   - Update both components to utilize the new `usePlayerName` custom hook.
3. **Fix the unrelated failing test in `src/tests/main.test.ts`**
   - Reset the `lastConfigData` module variable before each test in the `saveConfig` test suite to fix the failing synchronization test caused by data caching.
4. **Complete pre-commit steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
5. **Submit the change**
   - Commit the refactored code and test fix.
