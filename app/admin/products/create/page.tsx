"use client";

import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/utils/supabase'; 
import BackButton from '@/component/BackButton';

interface NewProductCreation {
  name: string;
  category: string;
  description: string;
  price: number;
  // ── SWAPPED 'size' WITH HEIGHT AND WIDTH ──
  height: number;
  width: number;
}

interface SelectedImage {
  id: string;
  file: File;
  previewUrl: string;
}

export default function CreateProduct() {
  const route = useRouter();
  const [newProduct, setNewProduct] = useState<NewProductCreation>({
    name: '',
    category: '',
    description: '',
    price: 0,
    height: 0,
    width: 0,
  });
  
  const [loading, setLoading] = useState(false);
  // ── SUPPORTS MULTIPLE SELECTED IMAGE FILES INSTEAD OF A SINGLE FILE ──
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: name === 'price' || name === 'height' || name === 'width' 
        ? parseFloat(value) || 0 
        : value,
    });
  };

  // Append newly chosen files to the running list of images to upload
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles = Array.from(e.target.files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setSelectedImages((prev) => [...prev, ...newFiles]);

    // Reset the input so the same file can be re-selected later if removed
    e.target.value = '';
  };

  const handleRemoveSelectedImage = (id: string) => {
    setSelectedImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const backButton = () => {
    route.back();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!newProduct.category) {
      toast.error('Please select a category');
      return;
    }

    // Enforce that at least one image must be provided for a new product entry
    if (selectedImages.length === 0) {
      toast.error('Please upload at least one product presentation image');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload every selected file to Supabase Storage and collect the public URLs
      const uploadedUrls: string[] = [];

      for (const { file } of selectedImages) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw new Error(`Supabase upload failed: ${uploadError.message}`);

        const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }

      // 2. Construct payload with the full ordered list of uploaded image URLs
      const payloadWithUploadedImages = {
        ...newProduct,
        images: uploadedUrls,
      };

      // 3. Fire network payload away to your standard Node backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payloadWithUploadedImages),
      });

      if (!response.ok) throw new Error('Failed to create product record');
      
      toast.success('Product created successfully!');
      
      // Reset State Machine completely for next item entry
      setNewProduct({
        name: '',
        category: '',
        description: '',
        price: 0,
        height: 0,
        width: 0,
      });
      selectedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      setSelectedImages([]);
      route.push('/admin/products');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="il-root" style={{ padding: '3.5rem 0' }}>
      
      <div style={{ maxWidth: '620px', margin: '0 auto 2rem auto', padding: '0 1rem' }}>
        <BackButton />
      </div>
      
      {/* ── FORM HEADER AREA ── */}
      <header className="il-hero" style={{ paddingBottom: '2rem' }}>
        <p className="il-eyebrow">Studio Inventory</p>
        <h1 className="il-brand-name">New Piece</h1>
        <p className="il-brand-sub">Add an item to the active collection</p>
      </header>

      {/* ── EDITORIAL CONTAINER FORM ── */}
      <div className="il-form-container">
        <form onSubmit={handleSubmit} className="il-form">
          
          {/* Item Name Input */}
          <div className="il-field">
            <label className="il-label">Product Title</label>
            <input
              type="text"
              name="name"
              className="il-input"
              placeholder="e.g., Ochre Linen Runner"
              value={newProduct.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Category Dropdown */}
          <div className="il-field">
            <label className="il-label">Collection Group</label>
            <div className="il-select-wrapper">
              <select
                name="category"
                className="il-select"
                value={newProduct.category}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Choose a Category</option>
                <option value="Table Runners">Table Runners</option>
                <option value="Bags">Bags</option>
                <option value="Baby Shower Collection">Baby Shower Collection</option>
                <option value="Keychain Collection">Keychain Collection</option>
                <option value="Christmas Collection">Christmas Collection</option>
              </select>
            </div>
          </div>

          {/* Pricing & Dimensions */}
          <div className="il-field-row">
            <div className="il-field">
              <label className="il-label">Price ($ USD)</label>
              <input
                type="number"
                name="price"
                className="il-input"
                placeholder="0.00"
                step="0.01"
                value={newProduct.price || ''} 
                onChange={handleChange}
                required
              />
            </div>

            {/* ── SPLIT 'SIZE' INTO INDEPENDENT HEIGHT & WIDTH INPUTS ── */}
            <div className="il-field" style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="il-label">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  className="il-input"
                  placeholder="e.g., 45"
                  step="0.01"
                  value={newProduct.height || ''}
                  onChange={handleChange}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="il-label">Width (cm)</label>
                <input
                  type="number"
                  name="width"
                  className="il-input"
                  placeholder="e.g., 150"
                  step="0.01"
                  value={newProduct.width || ''}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Product Presentation Images ── NOW SUPPORTS MULTIPLE FILES ── */}
          <div className="il-field">
            <label className="il-label">Product Presentation Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="il-input"
              style={{ padding: '0.4rem 0' }}
              onChange={handleFilesChange}
            />

            {selectedImages.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginTop: '0.75rem',
                }}
              >
                {selectedImages.map((img, index) => (
                  <div
                    key={img.id}
                    style={{
                      position: 'relative',
                      width: '84px',
                      height: '84px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: index === 0 ? '2px solid var(--il-gold, #8B5E2F)' : '1px solid #ddd',
                    }}
                  >
                    <img
                      src={img.previewUrl}
                      alt={`Selected preview ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSelectedImage(img.id)}
                      aria-label="Remove image"
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(0,0,0,0.65)',
                        color: '#fff',
                        fontSize: '12px',
                        lineHeight: '20px',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: '11px', opacity: 0.6, marginTop: '0.5rem' }}>
              The first image will be used as the main product thumbnail.
            </p>
          </div>

          {/* Extended Description */}
          <div className="il-field">
            <label className="il-label">Design Details</label>
            <textarea
              name="description"
              className="il-textarea"
              placeholder="Describe the material characteristics, weaving, and textile patterns…"
              value={newProduct.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* FORM FOOTER NAV CONTROLS */}
          <div className="il-form-actions">
            <button type="button" className="il-btn-secondary" onClick={backButton}>
              Cancel
            </button>
            <button type="submit" className="il-btn-primary" disabled={loading}>
              {loading ? 'Uploading & Publishing...' : 'Publish Piece'}
            </button>
          </div>

        </form>
      </div>

      <footer className="il-footer" style={{ marginTop: '5rem' }}>
        <p>© {new Date().getFullYear()} Ilamaj · Internal Management System</p>
      </footer>
    </div>
    </>
  );
}