import Link from 'next/link'
import React from 'react'

export default function NavBar(){
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-black/30 border-b border-white/6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 shadow-[0_6px_30px_rgba(139,92,246,0.25)]">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" aria-hidden>
                <path d="M12 20s-7-4.35-9.5-7.5C-1.5 7 6 3 12 7c6-4 13.5 0 9.5 5.5C19 15.65 12 20 12 20z" fill="currentColor"/>
              </svg>
            </div>
            <span className="font-semibold text-white text-lg tracking-wide">Sparkd</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-white/80">
            <a href="#how-it-works" className="hover:text-white transition">How it works</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <Link href="/dating" className="ml-2 inline-flex items-center rounded-full bg-gradient-to-r from-pink-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-[0_8px_30px_rgba(139,92,246,0.18)] focus:outline-none focus:ring-2 focus:ring-pink-500">Start Sparkd</Link>
          </nav>

          <div className="md:hidden">
            <Link href="/dating" className="inline-flex items-center rounded-full bg-gradient-to-r from-pink-500 to-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-md">Start</Link>
          </div>
        </div>
      </div>
    </header>
  )
}
