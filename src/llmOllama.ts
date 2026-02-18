export async function ollamaChat(opts: {
  model: string;
  system: string;
  user: string;
  temperature?: number;
}) {
  const { model, system, user, temperature = 0.7 } = opts;

  const prompt = `${system}\n\nUSER:\n${user}\n\nCOACH:\n`;

  const r = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature,
        num_predict: 220,
      },
    }),
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Ollama error: ${r.status} ${text}`);
  }

  const data: any = await r.json();
  return (data.response || "").trim();
}
