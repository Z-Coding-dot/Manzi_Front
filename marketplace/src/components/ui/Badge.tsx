import type { HTMLAttributes } from 'react'

import { cn } from '@/utils/cn'

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'onDark'

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-paper text-body border-line',
  success: 'bg-forest-soft text-forest-deep border-forest-soft',
  warning: 'bg-sand-soft text-sand border-sand-soft',
  danger: 'bg-danger-soft text-danger border-danger-soft',
  info: 'bg-info-soft text-info border-info-soft',
  onDark: 'bg-white/15 text-white border-white/20',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  )
}
