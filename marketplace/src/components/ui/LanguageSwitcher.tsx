import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { getDirection, LANGUAGES, type LanguageCode } from '@/i18n/config'
import { cn } from '@/utils/cn'

export function LanguageSwitcher({ onDark = false }: { onDark?: boolean }) {
  const { i18n } = useTranslation()
  const current = i18n.language as LanguageCode

  function handleChange(lang: LanguageCode) {
    i18n.changeLanguage(lang)
    const dir = getDirection(lang)
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }

  return (
    <Select.Root value={current} onValueChange={(v) => handleChange(v as LanguageCode)}>
      <Select.Trigger
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm',
          onDark ? 'border-white/25 text-white hover:bg-white/10' : 'border-line bg-surface text-body hover:bg-paper',
        )}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">
          <Select.Value />
        </span>
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="overflow-hidden rounded-lg border border-line bg-surface shadow-lg" position="popper" sideOffset={6}>
          <Select.Viewport className="p-1">
            {Object.entries(LANGUAGES).map(([code, meta]) => (
              <Select.Item
                key={code}
                value={code}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-md px-2.5 py-1.5 text-sm text-body outline-none data-[highlighted]:bg-forest-soft data-[highlighted]:text-forest-deep"
              >
                <Select.ItemText>{meta.nativeLabel}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check className="h-3.5 w-3.5" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
