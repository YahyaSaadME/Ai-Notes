'use client'
import Sidebar from './Sidebar'
import { Suspense, useState, useEffect } from 'react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    // Auto-collapse on smaller screens
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true)
      }
    }
    
    // Set initial state
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Suspense fallback={null}>
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </Suspense>
      <div className={`flex-1 transition-all duration-300 min-h-screen ${
        isCollapsed ? 'ml-16' : 'ml-16 lg:ml-64'
      }`}>
        <main className="p-8 bg-black min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
