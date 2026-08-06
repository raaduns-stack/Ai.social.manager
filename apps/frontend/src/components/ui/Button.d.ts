import { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps<T extends ElementType = 'button'> =
  ComponentPropsWithoutRef<T> & {
    /** Which HTML element or component to render as. Defaults to 'button'. */
    as?: T
    variant?: ButtonVariant
    size?: ButtonSize
    className?: string
    children?: ReactNode
  }

declare function Button<T extends ElementType = 'button'>(
  props: ButtonProps<T>,
): JSX.Element

export default Button
