'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Product {
  id: string
  name: string
  description: string
  sale_price: number
  cost_price: number
  unit: string
  icon: string
  is_active: boolean
  category_id: string
  product_categories?: Category
}

interface Props {
  initialCategories: Category[]
  initialProducts: Product[]
}

export default function ProductsManager({ initialCategories, initialProducts }: Props) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [products, setProducts] = useState(initialProducts)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  // Form para nuevo producto
  const [newProduct, setNewProduct] = useState({
    name: '',
    sale_price: '',
    cost_price: '',
    unit: 'unidad',
    category_id: ''
  })

  // Form para nueva categoría
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '📦'
  })

  const filteredProducts = activeCategory
    ? products.filter(p => p.category_id === activeCategory)
    : products

  const handleAddCategory = async () => {
    if (!newCategory.name) return
    setSaving(true)

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'category', ...newCategory })
      })

      if (response.ok) {
        const { category } = await response.json()
        setCategories([...categories, category])
        setNewCategory({ name: '', icon: '📦' })
        setShowAddCategory(false)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.sale_price) return
    setSaving(true)

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'product',
          name: newProduct.name,
          sale_price: parseFloat(newProduct.sale_price),
          cost_price: parseFloat(newProduct.cost_price) || 0,
          unit: newProduct.unit,
          category_id: newProduct.category_id || null
        })
      })

      if (response.ok) {
        router.refresh()
        setNewProduct({ name: '', sale_price: '', cost_price: '', unit: 'unidad', category_id: '' })
        setShowAddProduct(false)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return

    try {
      await fetch(`/api/products?id=${id}&type=product`, { method: 'DELETE' })
      setProducts(products.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const calculateMargin = (salePrice: number, costPrice: number) => {
    if (salePrice === 0) return 0
    return ((salePrice - costPrice) / salePrice) * 100
  }

  return (
    <div className="space-y-6">
      {/* Categorías */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Categorías</h2>
          <button
            onClick={() => setShowAddCategory(true)}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            + Nueva Categoría
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !activeCategory
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.icon} {cat.name} ({products.filter(p => p.category_id === cat.id).length})
            </button>
          ))}
        </div>

        {/* Modal nueva categoría */}
        {showAddCategory && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Nombre de la categoría"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <select
                value={newCategory.icon}
                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                {['📦', '☕', '🍽️', '✂️', '🔧', '🛒', '💼', '🎨', '🏠', '🚗'].map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
              <button
                onClick={handleAddCategory}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Guardar
              </button>
              <button
                onClick={() => setShowAddCategory(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Productos */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Productos/Servicios
          </h2>
          <button
            onClick={() => setShowAddProduct(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            + Nuevo Producto
          </button>
        </div>

        {/* Formulario nuevo producto */}
        {showAddProduct && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-3">Nuevo Producto/Servicio</h3>
            <div className="grid md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Nombre *"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Precio venta *"
                  value={newProduct.sale_price}
                  onChange={(e) => setNewProduct({ ...newProduct, sale_price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Costo"
                  value={newProduct.cost_price}
                  onChange={(e) => setNewProduct({ ...newProduct, cost_price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <select
                  value={newProduct.category_id}
                  onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Sin categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddProduct(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddProduct}
                disabled={saving || !newProduct.name || !newProduct.sale_price}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de productos */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <span className="text-4xl block mb-2">📦</span>
            <p>No hay productos en esta categoría</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm border-b">
                  <th className="pb-3 font-medium">Producto/Servicio</th>
                  <th className="pb-3 font-medium">Categoría</th>
                  <th className="pb-3 font-medium text-right">Precio Venta</th>
                  <th className="pb-3 font-medium text-right">Costo</th>
                  <th className="pb-3 font-medium text-right">Margen</th>
                  <th className="pb-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const margin = calculateMargin(product.sale_price, product.cost_price)
                  return (
                    <tr key={product.id} className="border-b last:border-0">
                      <td className="py-4">
                        <span className="font-medium text-gray-900">
                          {product.icon} {product.name}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-sm text-gray-600">
                          {product.product_categories?.icon} {product.product_categories?.name || '-'}
                        </span>
                      </td>
                      <td className="py-4 text-right font-semibold">
                        €{product.sale_price.toFixed(2)}
                      </td>
                      <td className="py-4 text-right text-gray-600">
                        €{product.cost_price.toFixed(2)}
                      </td>
                      <td className="py-4 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          margin >= 50 ? 'bg-green-100 text-green-700' :
                          margin >= 30 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {margin.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}