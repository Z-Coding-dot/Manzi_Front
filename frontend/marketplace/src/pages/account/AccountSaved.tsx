import { useTranslation } from 'react-i18next'

import { AccountLayout } from '@/components/layout/AccountLayout'
import { EmptyState } from '@/components/ui/EmptyState'
import { PropertyCard } from '@/components/ui/PropertyCard'
import { mockProperties } from '@/data/mock/properties'
import { useAppSelector } from '@/redux/hooks'

export default function AccountSaved() {
  const { t } = useTranslation()
  const savedIds = useAppSelector((s) => s.saved.propertyIds)
  const saved = mockProperties.filter((p) => savedIds.includes(p.id))

  return (
    <AccountLayout>
      <h1 className="text-2xl text-ink">{t('account.saved')}</h1>

      {!saved.length ? (
        <div className="mt-6">
          <EmptyState title={t('account.noSaved')} />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((p, i) => (
            <PropertyCard key={p.id} property={p} index={i} />
          ))}
        </div>
      )}
    </AccountLayout>
  )
}
