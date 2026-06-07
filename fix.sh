#!/bin/bash
sed -i '/const { gameState, buzzQueue, earlyBuzzers, timer, players } = state;/a\  const playerMap = useMemo(() => {\n    return (players || []).reduce((acc, p) => {\n      acc[p.id] = p.name;\n      return acc;\n    }, {} as Record<number, string>);\n  }, [players]);\n\n  const getPlayerName = (id: number) => playerMap[id] || `Player ${id}`;' src/App.tsx
