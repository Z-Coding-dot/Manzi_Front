import type { ReactNode } from 'react'

import { Footer } from './Footer'
import { Navbar } from './Navbar'

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
