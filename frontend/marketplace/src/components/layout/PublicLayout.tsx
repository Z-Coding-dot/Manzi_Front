import type { ReactNode } from 'react'

import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { AnimatedContent } from './AnimatedContent'

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Navbar />
      <main className="min-w-0 flex-1"><AnimatedContent>{children}</AnimatedContent></main>
      <Footer />
    </div>
  )
}
