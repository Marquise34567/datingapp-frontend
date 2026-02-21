import React from 'react'

type Props = {q:string, a:string}

export default function FAQItem({q,a}:Props){
  return (
    <details className="group bg-white/6 rounded-2xl p-4 border border-white/8">
      <summary className="cursor-pointer list-none flex items-center justify-between text-white font-medium">
        <span>{q}</span>
        <span className="ml-4 text-white/70 group-open:rotate-180 transition-transform">▾</span>
      </summary>
      <div className="mt-3 text-sm text-white/75">{a}</div>
    </details>
  )
}
