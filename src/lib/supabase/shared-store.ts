// Shared in-memory store used by the mock client (works in both browser and server)

const memory: Record<string, unknown[]> = {};
const listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

export function getTable(name: string): Record<string, unknown>[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`plsfix_demo_${name}`);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return (memory[name] ?? []) as Record<string, unknown>[];
}

export function setTable(name: string, rows: Record<string, unknown>[]) {
  memory[name] = rows;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`plsfix_demo_${name}`, JSON.stringify(rows));
    } catch {
      // ignore
    }
  }
  notify();
}

export function onStoreChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
