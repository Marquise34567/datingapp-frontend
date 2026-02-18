export type AdviceResponse = {
  message?: string;
  insights?: any;
  strategy?: { headline?: string; why?: string; do?: string[]; dont?: string[] };
  replies?: Record<string, string[]>;
  datePlan?: any;
};

export async function fetchAdvice(payload: any): Promise<AdviceResponse> {
  const API_URL = import.meta.env.VITE_API_URL;
  if (!API_URL) throw new Error("Missing VITE_API_URL in frontend/.env");

  const res = await fetch(`${API_URL}/api/advice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Advice request failed");
  return data;
}
