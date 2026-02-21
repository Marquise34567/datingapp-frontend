import React from 'react'

type Props = {
  title: string
  desc: string
  icon?: React.ReactNode
}

export default function FeatureCard({title, desc, icon}:Props){
  return (
    <div className="bg-white/6 backdrop-blur-md border border-white/6 rounded-2xl p-5 shadow-lg hover:translate-y-[-4px] transition-transform">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 text-white">
          {icon ?? <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.35-9.5-7.5C-1.5 8 6 4 12 8c6-4 13.5 0 9.5 5.5C19 16.65 12 21 12 21z" fill="currentColor"/></svg>}
        </div>
        <div>
          <h3 className="text-white font-semibold">{title}</h3>
          <p className="text-sm text-white/70 mt-1">{desc}</p>
        </div>
      </div>
    </div>
  )
}
