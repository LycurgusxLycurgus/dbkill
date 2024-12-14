import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Navbar() {
  const router = useRouter()
  
  return (
    <nav className="bg-gray-800 text-white mb-8">
      <div className="container mx-auto px-4 py-3">
        <ul className="flex space-x-6">
          <li>
            <Link 
              href="/"
              className={`hover:text-blue-300 ${router.pathname === '/' ? 'text-blue-300' : ''}`}
            >
              Upload
            </Link>
          </li>
          <li>
            <Link 
              href="/visualize"
              className={`hover:text-blue-300 ${router.pathname === '/visualize' ? 'text-blue-300' : ''}`}
            >
              Visualize
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
} 