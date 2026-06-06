#!/bin/bash
git checkout --ours src/App.tsx
git add src/App.tsx benchmark.ts
git commit -m "Resolve merge conflict: prefer main's PenaltyDisplay refactor"
