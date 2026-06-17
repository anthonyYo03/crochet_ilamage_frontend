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
  image_url: string;
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
    image_url: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Track local upload file

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: name === 'price' || name === 'height' || name === 'width' 
        ? parseFloat(value) || 0 
        : value,
    });
  };

  // Track the raw image file when chosen
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
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

    // Enforce that an image asset file must be provided for a new product entry
    if (!selectedFile) {
      toast.error('Please upload a product presentation image');
      return;
    }

    setLoading(true);

    try {
      let finalImageUrl = '';

      // 1. Process the binary file and upload it to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, selectedFile);

      if (uploadError) throw new Error(`Supabase upload failed: ${uploadError.message}`);

      // 2. Gather the generated absolute public URL asset string
      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      finalImageUrl = data.publicUrl;

      // 3. Construct payload replacing placeholder image_url with your public storage link
      const payloadWithUploadedImage = {
        ...newProduct,
        image_url: finalImageUrl,
      };

      // 4. Fire network payload away to your standard Node backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payloadWithUploadedImage),
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
        image_url: '',
      }); 
      setSelectedFile(null);
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
                <option value="Kitchen Collection">Kitchen Collection</option>
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

          {/* Product Presentation Image */}
          <div className="il-field">
            <label className="il-label">Product Presentation Image</label>
            <input
              type="file"
              accept="image/*"
              className="il-input"
              style={{ padding: '0.4rem 0' }}
              onChange={handleFileChange}
              required
            />
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