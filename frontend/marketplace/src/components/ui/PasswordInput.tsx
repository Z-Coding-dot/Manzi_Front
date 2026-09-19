import { Eye, EyeOff } from 'lucide-react'
import { forwardRef, useState, type InputHTMLAttributes } from 'react'

import { cn } from '@/utils/cn'

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  showLabel?: string
  hideLabel?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, id, className, showLabel = 'Show password', hideLabel = 'Hide password', ...props }, ref) => {
    const [visible, setVisible] = useState(false)
    return (
      <div>
        <label className="block text-sm font-medium text-body" htmlFor={id}>
          {label}
        </label>
        <div className="relative mt-1.5">
          <input
            ref={ref}
            id={id}
            type={visible ? 'text' : 'password'}
            className={cn(
              'w-full rounded-lg border border-line bg-surface px-3 py-2 pe-10 text-sm text-ink outline-none focus:border-forest',
              className,
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-body"
            aria-label={visible ? hideLabel : showLabel}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'
