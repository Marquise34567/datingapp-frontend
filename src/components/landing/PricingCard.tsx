import Link from 'next/link'
import React from 'react'

type Props = {
  title: string
  price: React.ReactNode
  features: string[]
  highlighted?: boolean
  cta?: {label:string, href:string}
}

export default function PricingCard({title, price, features, highlighted=false, cta}:Props){
  return (
    <div className={`rounded-2xl p-6 border ${highlighted? 'bg-gradient-to-br from-pink-600/20 to-violet-700/20 border-transparent shadow-2xl' : 'bg-white/6 border-white/8'} `}>
      <h4 className="text-white text-lg font-semibold">{title}</h4>
      <div className="mt-3 text-white/90 text-2xl font-bold">{price}</div>
      <ul className="mt-4 space-y-2 text-sm text-white/80">
        {features.map((f,i)=>(<li key={i}>• {f}</li>))}
      </ul>
      {cta && (
        <div className="mt-6">
          <Link href={cta.href} className={`inline-flex w-full justify-center px-4 py-2 rounded-full font-semibold ${highlighted? 'bg-white text-violet-700 shadow-md' : 'bg-white/8 text-white hover:bg-white/10'}`}>
            {cta.label}
          </Link>
        </div>
      )}
    </div>
  )
}
