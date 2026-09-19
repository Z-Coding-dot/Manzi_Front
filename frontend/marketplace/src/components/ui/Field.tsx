import { forwardRef, type InputHTMLAttributes } from 'react'

import { cn } from '@/utils/cn'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  trailing?: React.ReactNode
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, id, trailing, className, ...props }, ref) => (
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-body" htmlFor={id}>
          {label}
        </label>
        {trailing}
      </div>
      <input
        ref={ref}
        id={id}
        className={cn(
          'mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-forest',
          className,
        )}
        {...props}
      />
    </div>
  ),
)
Field.displayName = 'Field'
