import React from 'react'
import NavBar from '../components/landing/NavBar'
import Hero from '../components/landing/Hero'
import FeatureCard from '../components/landing/FeatureCard'
import PricingCard from '../components/landing/PricingCard'
import FAQItem from '../components/landing/FAQItem'
import Link from 'next/link'

export default function Page(){
  const features = [
    {title:'Smart text rewrites', desc:'Rewrite messages so they sound like you and get replies.'},
    {title:'Tone control', desc:'Choose calm, playful, or confident to match the vibe.'},
    {title:'Attachment style insights', desc:'Understand recurring patterns and improve connection.'},
    {title:`What they're thinking`, desc:'Analyze signals and suggested next moves.'},
    {title:'Red flag detection', desc:'Spot subtle cues that may show mismatch or problems.'},
    {title:'Follow-up sequences', desc:'Automated, thoughtful follow-ups that feel natural.'},
    {title:'Screenshot analysis (coming soon)', desc:'Analyze screenshots to extract context and tone.'},
    {title:'Rizz playbook mode', desc:'Playful prompts and openers tuned for chemistry.'},
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-black text-white overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl filter opacity-60" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-700/20 rounded-full blur-3xl filter opacity-60" />

      <NavBar />

      <main className="pt-8">
        <Hero />

        <section className="mt-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-full py-3 px-6 flex items-center justify-center gap-6 bg-gradient-to-r from-white/4 via-white/6 to-white/4 border border-white/6">
              <div className="text-sm text-white/80">Trusted by <span className="font-semibold">4,000+</span> daters</div>
              <div className="h-1 w-px bg-white/6" />
              <div className="text-sm text-white/80"><span className="font-semibold">40M+</span> messages improved</div>
              <div className="h-1 w-px bg-white/6" />
              <div className="text-sm text-white/80"><span className="font-semibold">4.8★</span> avg rating</div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-6">Features</h2>
            <p className="text-white/70 max-w-2xl mb-6">Tools built to help you send the right message, read signals, and act with confidence.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f,i)=>(
                <FeatureCard key={i} title={f.title} desc={f.desc} />
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-6">How it works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/6 p-6 rounded-3xl border border-white/8 backdrop-blur-md">
                <div className="text-pink-400 font-bold text-2xl">1</div>
                <h3 className="mt-3 font-semibold text-white">Paste a text or explain the situation</h3>
                <p className="text-white/75 mt-2 text-sm">Share the exact message or describe the context — quick and private.</p>
              </div>
              <div className="bg-white/6 p-6 rounded-3xl border border-white/8 backdrop-blur-md">
                <div className="text-pink-400 font-bold text-2xl">2</div>
                <h3 className="mt-3 font-semibold text-white">Choose a tone</h3>
                <p className="text-white/75 mt-2 text-sm">Calm, playful, confident — pick the voice you want to send.</p>
              </div>
              <div className="bg-white/6 p-6 rounded-3xl border border-white/8 backdrop-blur-md">
                <div className="text-pink-400 font-bold text-2xl">3</div>
                <h3 className="mt-3 font-semibold text-white">Get a reply that sounds like you</h3>
                <p className="text-white/75 mt-2 text-sm">Receive a tailored reply plus suggested next steps you can use right away.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-6">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PricingCard title="Free" price={<span className="font-semibold">Free</span>} features={["3–5 responses/day","Basic advice"]} cta={{label:'Start Free', href:'/dating'}} />
              <PricingCard title="Premium" price={<span>$7/mo</span>} features={["Unlimited messages","Deeper analysis","Tone controls","Rewrites & follow-ups"]} highlighted cta={{label:'Upgrade to Premium', href:'/pricing'}} />
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-6">FAQ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FAQItem q="Does Sparkd replace therapy?" a="No. Sparkd gives conversational and communication help — it’s not a substitute for professional mental health care." />
              <FAQItem q="Is it private?" a="Yes. Messages are private and not shared; see our Privacy policy for details." />
              <FAQItem q="Can it help with texting?" a="Absolutely — Sparkd is optimized for DMs and short texts with tone-aware rewrites and suggestions." />
              <FAQItem q="How does Premium work?" a="Premium unlocks unlimited messages, deeper analysis, tone controls, and follow-up sequences." />
            </div>
          </div>
        </section>

        <footer className="mt-20 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 shadow-lg">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white"><path d="M12 20s-7-4.35-9.5-7.5C-1.5 7 6 3 12 7c6-4 13.5 0 9.5 5.5C19 15.65 12 20 12 20z" fill="currentColor"/></svg>
              </div>
              <div>
                <div className="font-semibold">Sparkd</div>
                <div className="text-sm text-white/70">Dating advice that actually sounds like you.</div>
              </div>
            </div>

            <div className="flex gap-6 text-sm text-white/70">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-white/60">© {new Date().getFullYear()} Sparkd</div>
        </footer>
      </main>
    </div>
  )
}
