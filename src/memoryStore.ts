type Role = "user" | "coach";

export type Turn = { role: Role; text: string; ts: number };

const store = new Map<string, Turn[]>();

export function getHistory(sessionId: string) {
  return store.get(sessionId) || [];
}

export function pushTurn(sessionId: string, turn: Turn, max = 10) {
  const arr = store.get(sessionId) || [];
  arr.push(turn);
  const trimmed = arr.slice(-max);
  store.set(sessionId, trimmed);
  return trimmed;
}

export function getLastCoachLine(sessionId: string) {
  const arr = getHistory(sessionId);
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].role === "coach") return arr[i].text;
  }
  return "";
}
