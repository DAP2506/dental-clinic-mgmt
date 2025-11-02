'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase, formatCurrency, type Treatment } from '@/lib/supabase';
import { FileText, Clock, Tag, Plus, Search, Edit, Trash2, X, Save, AlertCircle, CheckCircle, Eye, Copy } from 'lucide-react';

interface TreatmentFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  duration_minutes: number;
}

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewingTreatment, setViewingTreatment] = useState<Treatment | null>(null);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [formData, setFormData] = useState<TreatmentFormData>({
    name: '',
    description: '',
    category: '',
    price: 0,
    duration_minutes: 30
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Common treatment categories
  const commonCategories = [
    'General Dentistry',
    'Cosmetic Dentistry', 
    'Oral Surgery',
    'Orthodontics',
    'Periodontics',
    'Endodontics',
    'Pediatric Dentistry',
    'Prosthodontics',
    'Oral Medicine',
    'Preventive Care'
  ];

  useEffect(() => {
    fetchTreatments();
  }, []);

  const fetchTreatments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('treatments')
        .select('*')
        .order('name', { ascending: true });

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTreatments(data || []);
    } catch (error) {
      console.error('Error fetching treatments:', error);
      setTreatments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatments();
  }, [searchTerm, selectedCategory]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: 0,
      duration_minutes: 30
    });
    setEditingTreatment(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (treatment: Treatment) => {
    setFormData({
      name: treatment.name,
      description: treatment.description || '',
      category: treatment.category || '',
      price: treatment.price,
      duration_minutes: treatment.duration_minutes || 30
    });
    setEditingTreatment(treatment);
    setShowModal(true);
  };

  const openDuplicateModal = (treatment: Treatment) => {
    setFormData({
      name: `${treatment.name} (Copy)`,
      description: treatment.description || '',
      category: treatment.category || '',
      price: treatment.price,
      duration_minutes: treatment.duration_minutes || 30
    });
    setEditingTreatment(null); // Not editing, creating new
    setShowModal(true);
  };

  const openDetailsModal = (treatment: Treatment) => {
    setViewingTreatment(treatment);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setViewingTreatment(null);
  };

  const closeModal = () => {
    if (JSON.stringify(formData) !== JSON.stringify({
      name: editingTreatment?.name || '',
      description: editingTreatment?.description || '',
      category: editingTreatment?.category || '',
      price: editingTreatment?.price || 0,
      duration_minutes: editingTreatment?.duration_minutes || 30
    })) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    setShowModal(false);
    resetForm();
  };

  const handleInputChange = (field: keyof TreatmentFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setErrorMessage('Treatment name is required');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
      return;
    }

    if (formData.price < 0) {
      setErrorMessage('Price cannot be negative');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
      return;
    }

    setSaving(true);
    try {
      const treatmentData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category.trim() || null,
        price: formData.price,
        duration_minutes: formData.duration_minutes
      };

      if (editingTreatment) {
        // Update existing treatment
        const { error } = await supabase
          .from('treatments')
          .update(treatmentData)
          .eq('id', editingTreatment.id);

        if (error) throw error;
      } else {
        // Create new treatment
        const { error } = await supabase
          .from('treatments')
          .insert([treatmentData]);

        if (error) throw error;
      }

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      closeModal();
      fetchTreatments();
    } catch (error) {
      console.error('Error saving treatment:', error);
      setErrorMessage('Error saving treatment. Please try again.');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (treatment: Treatment) => {
    if (!confirm(`Are you sure you want to delete "${treatment.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(treatment.id);
    try {
      const { error } = await supabase
        .from('treatments')
        .delete()
        .eq('id', treatment.id);

      if (error) throw error;

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      fetchTreatments();
    } catch (error) {
      console.error('Error deleting treatment:', error);
      setErrorMessage('Error deleting treatment. It may be in use by existing cases.');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
    } finally {
      setDeleting(null);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const categories = Array.from(new Set(treatments.map(t => t.category).filter(Boolean)));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Treatments</h1>
          </div>
          <div className="bg-white shadow rounded-lg animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Success/Error Messages */}
        {showSuccessMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-700">
              {editingTreatment ? 'Treatment updated successfully!' : 'Treatment saved successfully!'}
            </span>
          </div>
        )}

        {showErrorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <span className="text-red-700">{errorMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Treatments</h1>
            <p className="text-gray-600 mt-1">
              {treatments.length} treatment{treatments.length !== 1 ? 's' : ''} available
              {selectedCategory && ` in ${selectedCategory}`}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
          <button 
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Treatment
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search treatments..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Treatments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {treatments.length > 0 ? (
            treatments.map((treatment) => (
              <div key={treatment.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{treatment.name}</h3>
                      {treatment.category && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Tag className="h-3 w-3 mr-1" />
                          {treatment.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {treatment.description && (
                  <p className="text-gray-600 mb-4 line-clamp-3">{treatment.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Price:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(treatment.price)}
                    </span>
                  </div>
                  {treatment.duration_minutes && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-medium text-gray-900 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {treatment.duration_minutes} min
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => openDetailsModal(treatment)}
                    className="w-full text-gray-700 hover:text-gray-900 text-sm font-medium py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </button>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => openEditModal(treatment)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium py-2 px-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </button>
                    <button 
                      onClick={() => openDuplicateModal(treatment)}
                      className="text-green-600 hover:text-green-700 text-xs font-medium py-2 px-2 border border-green-600 rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </button>
                    <button 
                      onClick={() => handleDelete(treatment)}
                      disabled={deleting === treatment.id}
                      className="text-red-600 hover:text-red-700 text-xs font-medium py-2 px-2 border border-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      {deleting === treatment.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                      ) : (
                        <>
                          <Trash2 className="h-3 w-3 mr-1" />
                          Del
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No treatments found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No treatments match your search.' : 'Get started by adding your first treatment.'}
              </p>
              <button 
                onClick={openAddModal}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Treatment
              </button>
            </div>
          )}
        </div>

        {/* Add/Edit Treatment Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingTreatment ? 'Edit Treatment' : 'Add New Treatment'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Treatment Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter treatment name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter treatment description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {commonCategories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Or enter custom category"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 30)}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingTreatment ? 'Update' : 'Save'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Treatment Details Modal */}
        {showDetailsModal && viewingTreatment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Treatment Details</h2>
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{viewingTreatment.name}</h3>
                  {viewingTreatment.category && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <Tag className="h-3 w-3 mr-1" />
                      {viewingTreatment.category}
                    </span>
                  )}
                </div>

                {viewingTreatment.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                    <p className="text-gray-600 leading-relaxed">{viewingTreatment.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Price</h4>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(viewingTreatment.price)}
                    </p>
                  </div>

                  {viewingTreatment.duration_minutes && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Duration</h4>
                      <p className="text-lg font-semibold text-gray-900 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {viewingTreatment.duration_minutes} min
                      </p>
                    </div>
                  )}
                </div>

                {viewingTreatment.created_at && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Created</h4>
                    <p className="text-gray-600">
                      {new Date(viewingTreatment.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      closeDetailsModal();
                      openEditModal(viewingTreatment);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Treatment
                  </button>
                  <button
                    onClick={closeDetailsModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
