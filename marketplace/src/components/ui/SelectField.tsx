import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react'

import { cn } from '@/utils/cn'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  children: ReactNode
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, id, className, children, ...props }, ref) => (
    <div>
      <label className="block text-sm font-medium text-body" htmlFor={id}>
        {label}
      </label>
      <select
        ref={ref}
        id={id}
        className={cn(
          'mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-forest',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  ),
)
SelectField.displayName = 'SelectField'
