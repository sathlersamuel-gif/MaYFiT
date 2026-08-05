export function timerDeadline(seconds, now = Date.now()) {
  const duration = Math.max(0, Number(seconds) || 0);
  return Number(now) + duration * 1000;
}

export function timerSecondsRemaining(deadline, now = Date.now()) {
  const remaining = Number(deadline) - Number(now);
  return Math.max(0, Math.ceil(remaining / 1000));
}
