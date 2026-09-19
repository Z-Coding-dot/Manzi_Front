import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export function Footer() {
  const { t } = useTranslation()

  const columns = [
    {
      title: t('app.name'),
      links: [
        { label: t('footer.about'), to: '/about' },
        { label: t('footer.help'), to: '/help' },
        { label: t('footer.contact'), to: '/contact' },
      ],
    },
    {
      title: t('footer.forOwners'),
      links: [{ label: t('nav.forProperties'), to: '/for-property-owners' }],
    },
    {
      title: t('footer.terms'),
      links: [
        { label: t('footer.terms'), to: '/terms' },
        { label: t('footer.privacy'), to: '/privacy' },
        { label: t('footer.cancellationPolicy'), to: '/cancellation-policy' },
      ],
    },
  ]

  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest text-xs font-bold text-white">M</div>
              <span className="font-display text-base text-ink">{t('app.name')}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{t('app.tagline')}</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-medium text-ink">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-muted hover:text-body">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-line pt-6 text-sm text-muted">
          © {new Date().getFullYear()} {t('app.name')}. {t('footer.rights')}
        </div>
      </div>
    </footer>
  )
}
