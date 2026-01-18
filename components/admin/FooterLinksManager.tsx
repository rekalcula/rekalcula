'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Shield, Mail, Linkedin, Instagram, Music2 as TikTok, Facebook } from 'lucide-react';

interface FooterLink {
  id?: number;
  name: string;
  url: string;
  icon_type: string;
  display_order: number;
  is_active: boolean;
}

const iconOptions = [
  { value: 'privacy', label: 'Política Privacidad', Icon: Shield },
  { value: 'contact', label: 'Contacto', Icon: Mail },
  { value: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
  { value: 'instagram', label: 'Instagram', Icon: Instagram },
  { value: 'tiktok', label: 'TikTok', Icon: TikTok },
  { value: 'facebook', label: 'Facebook', Icon: Facebook },
];

export default function FooterLinksManager() {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/footer-links');
      const result = await response.json();
      if (result.success) {
        setLinks(result.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingLink) return;

    try {
      const method = editingLink.id ? 'PUT' : 'POST';
      const response = await fetch('/api/footer-links', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingLink),
      });

      const result = await response.json();
      if (result.success) {
        await fetchLinks();
        setEditingLink(null);
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este enlace?')) return;

    try {
      const response = await fetch(`/api/footer-links?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        await fetchLinks();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const startCreate = () => {
    setEditingLink({
      name: '',
      url: '',
      icon_type: 'privacy',
      display_order: links.length + 1,
      is_active: true,
    });
    setIsCreating(true);
  };

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  // Renderizar formulario con type guard explícito
  const renderEditForm = () => {
    if (!editingLink) return null;

    // Ahora TypeScript sabe que editingLink no es null aquí
    const currentLink = editingLink;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">
          {isCreating ? 'Nuevo Enlace' : 'Editar Enlace'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre</label>
            <input
              type="text"
              value={currentLink.name}
              onChange={(e) => setEditingLink({ ...currentLink, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Ej: LinkedIn"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">URL</label>
            <input
              type="text"
              value={currentLink.url}
              onChange={(e) => setEditingLink({ ...currentLink, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Icono</label>
            <select
              value={currentLink.icon_type}
              onChange={(e) => setEditingLink({ ...currentLink, icon_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              {iconOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Orden</label>
            <input
              type="number"
              value={currentLink.display_order}
              onChange={(e) => setEditingLink({ ...currentLink, display_order: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={currentLink.is_active}
              onChange={(e) => setEditingLink({ ...currentLink, is_active: e.target.checked })}
              className="mr-2"
            />
            <label className="text-sm font-medium">Activo</label>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
          <button
            onClick={() => {
              setEditingLink(null);
              setIsCreating(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Enlaces del Footer</h2>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <Plus className="w-4 h-4" />
          Nuevo Enlace
        </button>
      </div>

      {/* Formulario de edición/creación */}
      {renderEditForm()}

      {/* Lista de enlaces */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Orden</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Icono</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">URL</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Estado</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {links.map((link) => {
              const iconOption = iconOptions.find(opt => opt.value === link.icon_type);
              const Icon = iconOption?.Icon;
              
              return (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{link.display_order}</td>
                  <td className="px-4 py-3">
                    {Icon && <Icon className="w-5 h-5 text-gray-600" />}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{link.name}</td>
                  <td className="px-4 py-3 text-sm text-blue-600 truncate max-w-xs">
                    {link.url}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      link.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {link.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingLink(link)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(link.id!)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}