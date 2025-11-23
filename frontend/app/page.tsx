import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-900 to-navy-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Welcome to Apranova LMS
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Enterprise Learning Management System for Data Professionals and Full-Stack Developers
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signin">
              <Button size="lg" variant="default">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
            <h3 className="text-2xl font-bold mb-3">Data Professional Track</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Business Analytics Dashboard</li>
              <li>• Automated ETL Pipeline</li>
              <li>• End-to-End Analytics Solution</li>
            </ul>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
            <h3 className="text-2xl font-bold mb-3">Full-Stack Developer Track</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Responsive Portfolio Website</li>
              <li>• E-Commerce Platform</li>
              <li>• Social Dashboard with DevOps</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

