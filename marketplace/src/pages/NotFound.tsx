import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-surface text-center">
      <p className="text-sm font-medium text-forest">404</p>
      <h1>Page not found</h1>
      <Link to="/" className="mt-2 text-sm text-forest hover:underline">
        Back to home
      </Link>
    </div>
  )
}
