'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  sale_price: number
  cost_price: number
  icon: string
  category_id: string
  product_categories?: {
    id: string
    name: string
    icon: string
  }
}

interface Category {
  id: string
  name: string
  icon: string
}

interface Props {
  products: Product[]
  categories: Category[]
}

interface SaleItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  cost_price: number
}

export default function QuickSaleForm({ products, categories }: Props) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [items, setItems] = useState<SaleItem[]>([])
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  const filteredProducts = activeCategory
    ? products.filter(p => p.category_id === activeCategory)
    : products

  const addItem = (product: Product) => {
    const existing = items.find(i => i.product_id === product.id)
    if (existing) {
      setItems(items.map(i => 
        i.product_id === product.id 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ))
    } else {
      setItems([...items, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.sale_price,
        cost_price: product.cost_price
      }])
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(items.filter(i => i.product_id !== productId))
    } else {
      setItems(items.map(i =>
        i.product_id === productId ? { ...i, quantity } : i
      ))
    }
  }

  const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  const totalCost = items.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0)
  const profit = total - totalCost

  const handleSubmit = async () => {
    if (items.length === 0) return
    setSaving(true)

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale_date: saleDate,
          items,
          source: 'manual'
        })
      })

      if (response.ok) {
        router.push('/dashboard/sales')
        router.refresh()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar la venta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Panel izquierdo: Productos */}
      <div className="md:col-span-2 space-y-4">
        {/* Fecha */}
        <div className="bg-gray-200 rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de venta
          </label>
          <input
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Categorías */}
        <div className="bg-gray-200 rounded-xl shadow-sm p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !activeCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de productos */}
        <div className="bg-gray-200 rounded-xl shadow-sm p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const itemInCart = items.find(i => i.product_id === product.id)
              return (
                <button
                  key={product.id}
                  onClick={() => addItem(product)}
                  className={`p-4 rounded-xl border-2 text-center transition-all hover:shadow-md ${
                    itemInCart
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">{product.icon || '📦'}</span>
                  <span className="text-sm font-medium text-gray-900 block truncate">
                    {product.name}
                  </span>
                  <span className="text-sm text-blue-600 font-semibold">
                    €{product.sale_price.toFixed(2)}
                  </span>
                  {itemInCart && (
                    <span className="absolute top-1 right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {itemInCart.quantity}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Panel derecho: Resumen */}
      <div className="space-y-4">
        <div className="bg-gray-200 rounded-xl shadow-sm p-6 sticky top-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resumen de Venta
          </h3>

          {items.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Selecciona productos para añadirlos
            </p>
          ) : (
            <>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product_id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-xs text-gray-500">
                        €{item.unit_price.toFixed(2)} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <p className="w-16 text-right font-semibold">
                      €{(item.unit_price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">€{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Costo</span>
                  <span className="text-gray-500">€{totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Beneficio</span>
                  <span className="font-medium">€{profit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Venta'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}