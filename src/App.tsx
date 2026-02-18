import React from 'react'
import DatingAdviceUI from './components/DatingAdviceUI'
import PremiumDatingAdvicePage from './components/PremiumDatingAdvicePage'

export default function App() {
  return (
    <div>
      {/* Toggle between UIs: primary vs premium. */}
      <PremiumDatingAdvicePage />
    </div>
  )
}
