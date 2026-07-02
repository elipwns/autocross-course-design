export const createStack = () => ({ past: [], future: [] });

export const push = (stack, snapshot) => ({
  past: [...stack.past, snapshot],
  future: [],
});

export function undo(stack, currentSnapshot) {
  if (stack.past.length === 0) return { stack, snapshot: currentSnapshot };
  const snapshot = stack.past[stack.past.length - 1];
  return {
    stack: {
      past: stack.past.slice(0, -1),
      future: [currentSnapshot, ...stack.future],
    },
    snapshot,
  };
}

export function redo(stack, currentSnapshot) {
  if (stack.future.length === 0) return { stack, snapshot: currentSnapshot };
  const snapshot = stack.future[0];
  return {
    stack: {
      past: [...stack.past, currentSnapshot],
      future: stack.future.slice(1),
    },
    snapshot,
  };
}

export const canUndo = (stack) => stack.past.length > 0;
export const canRedo = (stack) => stack.future.length > 0;
