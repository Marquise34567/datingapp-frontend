import React, { useEffect, useState } from "react";

export default function Landing({ onStart }: { onStart?: () => void }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  function goToDating() {
    try {
      window.history.pushState({}, "", "/dating");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (e) {
      window.location.href = "/dating";
    }
    onStart?.();
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-[#0b0710] to-[#07060a] text-white relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-pink-600/10 filter blur-3xl opacity-60"></div>
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-violet-700/10 filter blur-3xl opacity-60"></div>

      <header className="sticky top-0 z-40 bg-black/30 backdrop-blur-md py-4 border-b border-white/6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl grid place-items-center bg-gradient-to-br from-pink-500 to-violet-600 shadow-lg">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor" aria-hidden>
                <path d="M12 20s-7-4.35-9.5-7.5C-1.5 7 6 3 12 7c6-4 13.5 0 9.5 5.5C19 15.65 12 20 12 20z" />
              </svg>
            </div>
            <div className="font-semibold tracking-wide text-white">Sparkd</div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-white/80">
            <a href="#how-it-works" className="hover:text-white transition">How it works</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <button onClick={goToDating} className="ml-2 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg bg-gradient-to-r from-pink-500 to-violet-600 hover:scale-[1.02] transition">Start Sparkd</button>
          </nav>

          <div className="md:hidden">
            <button onClick={goToDating} className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-md bg-gradient-to-r from-pink-500 to-violet-600">Start</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-20">
        <section className={`grid gap-10 lg:grid-cols-2 items-center ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} transition-all duration-700`}>
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">Dating advice that actually sounds like you.</h1>
            <p className="text-lg text-white/80 max-w-xl">Real-time help for texts, DMs, situationships, and dates — private, fast, and human.</p>

            <div className="flex items-center gap-4">
              <button onClick={goToDating} className="inline-flex items-center rounded-full px-6 py-3 text-base font-semibold text-white shadow-2xl bg-gradient-to-r from-pink-500 to-violet-600 hover:scale-[1.02] transition-transform">Start Sparkd</button>
              <a href="#how-it-works" className="inline-flex items-center justify-center rounded-full px-5 py-3 bg-white/6 text-white/90 hover:bg-white/10 transition">See how it works</a>
            </div>

            <div className="mt-8">
              <div className="inline-flex items-center gap-3 bg-white/4 px-4 py-2 rounded-full border border-white/6">
                <span className="text-sm text-white/80">Trusted by <span className="font-semibold">4,000+</span> daters · <span className="font-semibold">40M+</span> messages improved · <span className="font-semibold">4.8★</span> avg rating</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="glass-card p-5 shadow-2xl transform transition hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">Sparkd Preview</div>
                <div className="text-xs text-white/60">Private • Live</div>
              </div>

              <div className="bg-white/3 rounded-2xl p-4">
                <div className="text-sm text-white/70 mb-3">You</div>
                <div className="bg-white/6 rounded-2xl px-4 py-3 max-w-[80%] mb-3">She left me on read</div>

                <div className="text-sm text-white/70 mb-2">Sparkd</div>
                <div className="bg-gradient-to-r from-pink-500 to-violet-600 text-white rounded-2xl px-4 py-3 max-w-[85%]">
                  Give it 24 hours. Then send something light like, "Haha no worries — quick question: movie night or coffee this week?"
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full bg-pink-500/6 blur-2xl"></div>
          </div>
        </section>

        <section id="features" className="mt-20">
          <h2 className="text-3xl font-bold mb-3">Features</h2>
          <p className="text-white/70 mb-6 max-w-2xl">Everything you need to text with confidence — tools to rewrite, analyze, and follow up.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Smart text rewrites', desc: 'Rewrite messages so they sound like you.' },
              { title: 'Tone control', desc: 'Choose calm, playful, or confident.' },
              { title: 'Attachment style insights', desc: 'Understand recurring patterns and improve connection.' },
              { title: `What they're thinking`, desc: 'Interpret signals and suggested next moves.' },
              { title: 'Red flag detection', desc: 'Spot subtle cues that may show mismatch.' },
              { title: 'Follow-up sequences', desc: 'Automate natural follow-ups that feel personal.' },
              { title: 'Screenshot analysis (coming soon)', desc: 'Contextual analysis of screenshots.' },
              { title: 'Rizz playbook mode', desc: 'Openers and playful prompts to spark chemistry.' },
            ].map((f, i) => (
              <div key={i} className="glass-card p-5 hover:-translate-y-1 transition">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-violet-600 grid place-items-center mb-4 text-white">{/* icon */}</div>
                <div className="font-semibold mb-1">{f.title}</div>
                <div className="text-sm text-white/70">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mt-20">
          <h2 className="text-3xl font-bold mb-3">How it works</h2>
          <p className="text-white/70 mb-6 max-w-2xl">Paste a message or describe the situation, pick a tone, and get a reply that sounds like you.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 text-center">
              <div className="text-pink-400 font-bold text-2xl">1</div>
              <h3 className="mt-3 font-semibold text-white">Paste a text or explain the situation</h3>
              <p className="text-white/75 mt-2 text-sm">Share the exact message or describe the context — quick and private.</p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-pink-400 font-bold text-2xl">2</div>
              <h3 className="mt-3 font-semibold text-white">Choose tone</h3>
              <p className="text-white/75 mt-2 text-sm">Calm / Playful / Confident — pick the voice you want to send.</p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-pink-400 font-bold text-2xl">3</div>
              <h3 className="mt-3 font-semibold text-white">Get a reply that sounds like you</h3>
              <p className="text-white/75 mt-2 text-sm">Receive a tailored reply plus next steps you can use immediately.</p>
            </div>
          </div>
        </section>

        <section id="pricing" className="mt-20">
          <h2 className="text-3xl font-bold mb-3">Pricing</h2>
          <p className="text-white/70 mb-6 max-w-2xl">Simple pricing for people who text. Try Free, upgrade to Premium for unlimited access.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <div className="text-sm text-white/80">Free</div>
              <div className="text-3xl font-bold mt-4">Free</div>
              <ul className="mt-4 text-white/80 space-y-2">
                <li>3–5 responses/day</li>
                <li>Basic advice</li>
              </ul>
              <div className="mt-6">
                <button onClick={goToDating} className="w-full rounded-full px-4 py-2 bg-white/8 text-white font-semibold">Start Free</button>
              </div>
            </div>

            <div className="glass-card p-8 transform scale-101 shadow-2xl border border-white/6">
              <div className="text-sm text-white/80">Premium</div>
              <div className="text-4xl font-bold mt-4">$7/mo</div>
              <ul className="mt-4 text-white/80 space-y-2">
                <li>Unlimited messages</li>
                <li>Deeper analysis & tone controls</li>
                <li>Rewrites + follow-ups</li>
              </ul>
              <div className="mt-6">
                <button onClick={goToDating} className="w-full rounded-full px-4 py-3 bg-gradient-to-r from-pink-500 to-violet-600 text-white font-semibold">Upgrade to Premium</button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 py-12 rounded-2xl bg-gradient-to-r from-pink-600/10 to-violet-700/10 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold">Stop overthinking. Start responding.</h3>
            <p className="text-white/80 mt-3">Sparkd helps you reply with confidence — every time.</p>
            <div className="mt-6">
              <button onClick={goToDating} className="inline-flex items-center rounded-2xl px-6 py-3 text-base font-semibold text-white shadow-xl bg-gradient-to-r from-pink-500 to-violet-600">Try Sparkd Now</button>
            </div>
          </div>
        </section>

        <footer id="footer" className="mt-16 pt-8 pb-12 text-sm text-white/70">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg grid place-items-center bg-gradient-to-br from-pink-500 to-violet-600">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor" aria-hidden>
                  <path d="M12 20s-7-4.35-9.5-7.5C-1.5 7 6 3 12 7c6-4 13.5 0 9.5 5.5C19 15.65 12 20 12 20z" />
                </svg>
              </div>
              <div className="font-semibold">Sparkd</div>
              <div className="ml-3 text-white/70 text-sm">Dating advice that actually sounds like you.</div>
            </div>

            <div className="flex gap-6">
              <a href="/privacy" className="hover:text-white transition">Privacy</a>
              <a href="/terms" className="hover:text-white transition">Terms</a>
              <a href="/contact" className="hover:text-white transition">Contact</a>
            </div>
          </div>
          <div className="mt-6 text-center text-xs text-white/60">© {new Date().getFullYear()} Sparkd</div>
        </footer>
      </main>

      <style>{`
        .glass-card{background:rgba(255,255,255,0.04);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.06);border-radius:1rem}
      `}</style>
    </div>
  );
}
