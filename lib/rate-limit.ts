const actionAttempts = new Map<string, number[]>();

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 30;
const MAX_DELAY_MS = 2_000;

function prune(timestamps: number[], now: number) {
  const cutoff = now - WINDOW_MS;
  while (timestamps.length > 0 && timestamps[0]! < cutoff) {
    timestamps.shift();
  }
}

export async function applyServerRateLimit(userId: string): Promise<void> {
  const now = Date.now();
  let timestamps = actionAttempts.get(userId);

  if (!timestamps) {
    timestamps = [];
    actionAttempts.set(userId, timestamps);
  }

  prune(timestamps, now);

  if (timestamps.length >= MAX_ATTEMPTS) {
    const earliest = timestamps[0]!;
    const needed = earliest + WINDOW_MS - now;
    const delayMs = Math.min(needed > 0 ? needed : 0, MAX_DELAY_MS);

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    prune(timestamps, Date.now());
  }

  timestamps.push(Date.now());
}
