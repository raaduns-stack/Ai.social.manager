import { cn } from '../../utils/cn'

function getInitials(name = '') {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Usage: <Avatar name="Treasure Adamu" src={optionalImageUrl} size={40} />
 * Falls back to initials on a colored circle when no image is provided.
 */
export default function Avatar({ name, src, size = 36, className }) {
  const dimension = { width: size, height: size }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={dimension}
        className={cn('rounded-full object-cover', className)}
      />
    )
  }

  return (
    <div
      style={dimension}
      className={cn(
        'flex items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700',
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
