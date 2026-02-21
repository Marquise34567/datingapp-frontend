import React from 'react'
import Link from 'next/link'

export default function Hero(){
  return (
    <section id="hero" className="pt-12 lg:pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight text-white">Dating advice that actually sounds like you.</h1>
            <p className="text-lg text-white/80 max-w-xl">Real-time help for texts, DMs, situationships, and dates — private, fast, and human.</p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link href="/dating" className="inline-flex items-center justify-center rounded-full px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-600 text-white font-semibold shadow-2xl hover:scale-[1.02] transition-transform">Start Sparkd</Link>
              <a href="#how-it-works" className="inline-flex items-center justify-center rounded-full px-6 py-3 bg-white/6 text-white/90 hover:bg-white/10 transition">See how it works</a>
            </div>

            <div className="flex gap-4 mt-4 text-sm text-white/75">
              <div className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400/90"/> Trusted privacy
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400/90"/> Real-time rewrites
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400/90"/> Premium insights
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl bg-white/4 backdrop-blur-md border border-white/8 p-5 shadow-[0_20px_50px_rgba(2,6,23,0.6)] w-full max-w-md mx-auto">
              <div className="text-sm text-white/70 mb-3">Chat preview</div>
              <div className="space-y-3">
                <div className="bg-white/8 text-white p-3 rounded-xl max-w-[80%]">Hey — I had a great time tonight 😄</div>
                <div className="self-end bg-white/6 text-white p-3 rounded-xl max-w-[70%] ml-auto">Really? I thought it was a bit awkward…</div>
                <div className="bg-white/8 text-white p-3 rounded-xl max-w-[75%]">It wasn’t — you were fun. Want to grab coffee?</div>
              </div>
              <div className="mt-4 text-sm text-white/70">Tone: Warm • Suggest: Confident rewrite</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
