import { 
  CreditCard, 
  Banknote, 
  Building2, 
  FileText, 
  Calendar,
  Wallet
} from 'lucide-react'

interface PaymentMethodBadgeProps {
  method: string
  size?: 'sm' | 'md' | 'lg'
}

const PAYMENT_METHODS: Record<string, {
  label: string
  icon: any
  color: string
}> = {
  cash: {
    label: 'Efectivo',
    icon: Banknote,
    color: 'bg-green-100 text-green-700 border-green-300'
  },
  card: {
    label: 'Tarjeta',
    icon: CreditCard,
    color: 'bg-blue-100 text-blue-700 border-blue-300'
  },
  transfer: {
    label: 'Transferencia',
    icon: Building2,
    color: 'bg-purple-100 text-purple-700 border-purple-300'
  },
  promissory_note: {
    label: 'Pagaré',
    icon: FileText,
    color: 'bg-amber-100 text-amber-700 border-amber-300'
  },
  direct_debit: {
    label: 'Domiciliación',
    icon: Wallet,
    color: 'bg-indigo-100 text-indigo-700 border-indigo-300'
  },
  credit_30: {
    label: 'Crédito 30 días',
    icon: Calendar,
    color: 'bg-orange-100 text-orange-700 border-orange-300'
  },
  credit_60: {
    label: 'Crédito 60 días',
    icon: Calendar,
    color: 'bg-red-100 text-red-700 border-red-300'
  },
  credit_90: {
    label: 'Crédito 90 días',
    icon: Calendar,
    color: 'bg-rose-100 text-rose-700 border-rose-300'
  }
}

export default function PaymentMethodBadge({ 
  method, 
  size = 'md' 
}: PaymentMethodBadgeProps) {
  const config = PAYMENT_METHODS[method] || PAYMENT_METHODS.transfer
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${config.color}
        ${sizeClasses[size]}
      `}
    >
      <Icon className={iconSizes[size]} />
      {config.label}
    </span>
  )
}