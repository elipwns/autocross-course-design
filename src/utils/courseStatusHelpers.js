// State machine: { [currentStatus]: { [nextStatus]: (actorRole, ownerId?, userId?) => boolean } }
const TRANSITIONS = {
  DRAFT: {
    SUBMITTED: (role) => role === 'member' || role === 'admin',
    deleted: (role, isOwner) => role === 'admin' || isOwner,
  },
  SUBMITTED: {
    APPROVED: (role) => role === 'admin',
    REJECTED: (role) => role === 'admin',
    DRAFT: (role, isOwner) => role === 'admin' || isOwner,
  },
  REJECTED: {
    SUBMITTED: (role, isOwner) => isOwner || role === 'admin',
  },
  APPROVED: {},
};

export function canTransition(currentStatus, nextStatus, actorRole, isOwner = false) {
  const fromMap = TRANSITIONS[currentStatus];
  if (!fromMap) return false;
  const check = fromMap[nextStatus];
  if (!check) return false;
  return check(actorRole, isOwner);
}
