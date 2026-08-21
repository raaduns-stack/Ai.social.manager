import {
  Shield,
  ShieldCheck,
  PenTool,
  Headphones,
  DollarSign,
  Megaphone,
  UserCheck,
  HelpCircle,
} from 'lucide-react'
import Badge from '../ui/Badge'

const ROLE_MAP = {
  'Super Admin': {
    tone: 'danger',
    Icon: Shield,
  },
  'super_admin': {
    tone: 'danger',
    Icon: Shield,
  },
  'Admin': {
    tone: 'primary',
    Icon: ShieldCheck,
  },
  'Account Manager': {
    tone: 'primary',
    Icon: ShieldCheck,
  },
  'account_manager': {
    tone: 'primary',
    Icon: ShieldCheck,
  },
  'Content Manager': {
    tone: 'success',
    Icon: PenTool,
  },
  'Reviewer': {
    tone: 'success',
    Icon: PenTool,
  },
  'reviewer': {
    tone: 'success',
    Icon: PenTool,
  },
  'Customer Support': {
    tone: 'warning',
    Icon: Headphones,
  },
  'Support Staff': {
    tone: 'warning',
    Icon: Headphones,
  },
  'support_staff': {
    tone: 'warning',
    Icon: Headphones,
  },
  'Finance': {
    tone: 'neutral',
    Icon: DollarSign,
  },
  'Designer': {
    tone: 'neutral',
    Icon: DollarSign,
  },
  'designer': {
    tone: 'neutral',
    Icon: DollarSign,
  },
  'Marketing': {
    tone: 'primary',
    Icon: Megaphone,
  },
  'Moderator': {
    tone: 'warning',
    Icon: UserCheck,
  },
}

/**
 * RoleBadge displays a staff member's role with a corresponding icon and color tone.
 * Uses existing design tokens and the shared Badge component.
 * 
 * Usage:
 * <RoleBadge role="Super Admin" />
 * <RoleBadge role="Content Manager" />
 */
export default function RoleBadge({ role }) {
  const conf = ROLE_MAP[role] || { tone: 'neutral', Icon: HelpCircle }
  const { tone, Icon } = conf

  return (
    <Badge tone={tone} className="gap-1 px-2 py-0.5 shrink-0">
      <Icon size={12} className="shrink-0" />
      <span>{role}</span>
    </Badge>
  )
}
