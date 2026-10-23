export function isAllowedUser(fromId, allowedId) {
  if (fromId === undefined || fromId === null || allowedId === undefined || allowedId === null) {
    return false;
  }
  return String(fromId) === String(allowedId);
}
