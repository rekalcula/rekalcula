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
  color: string  // Colores adaptados para fondo oscuro
}> = {
  cash: {
    label: 'Efectivo',
    icon: Banknote,
    color: 'bg-green-500/20 text-green-300 border-green-500/30'
  },
  card: {
    label: 'Tarjeta',
    icon: CreditCard,
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  },
  transfer: {
    label: 'Transferencia',
    icon: Building2,
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  },
  promissory_note: {
    label: 'Pagaré',
    icon: FileText,
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  },
  direct_debit: {
    label: 'Domiciliación',
    icon: Wallet,
    color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
  },
  credit_30: {
    label: 'Crédito 30 días',
    icon: Calendar,
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
  },
  credit_60: {
    label: 'Crédito 60 días',
    icon: Calendar,
    color: 'bg-red-500/20 text-red-300 border-red-500/30'
  },
  credit_90: {
    label: 'Crédito 90 días',
    icon: Calendar,
    color: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
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