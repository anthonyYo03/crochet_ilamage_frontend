"use client";

import { FormEvent, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';
import BackButton from '@/component/BackButton';
import { supabase } from '@/app/utils/supabase'; 

interface ProductData {
  name: string;
  category: string;
  description: string;
  price: number;
  // ── SWAPPED 'size' WITH HEIGHT AND WIDTH ──
  height: number;
  width: number;
  image_url: string;
}

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id; 

  const [product, setProduct] = useState<ProductData>({
    name: '',
    category: '',
    description: '',
    price: 0,
    height: 0,
    width: 0,
    image_url: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Track the image file

  // Fetch the existing product details when the page loads
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/getOne/${productId}`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to load product data');
        
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        toast.error('Could not load product details');
      } finally {
        setFetching(false);
      }
    };

    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct({
      ...product,
      [name]: name === 'price' || name === 'height' || name === 'width' 
        ? parseFloat(value) || 0 
        : value,
    });
  };

  // Track file selection when the user chooses an image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = product.image_url;

      // 1. If the admin selected a file, upload it to Supabase first!
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        // Upload to the public bucket you just created
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, selectedFile);

        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

        // Extract the absolute public URL
        const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
        finalImageUrl = data.publicUrl;
      }

      // 2. Prepare payload with the new Supabase URL
      const updatedProduct = {
        ...product,
        image_url: finalImageUrl,
      };

      // 3. Send payload directly to your backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/edit/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedProduct),
      });

      if (!response.ok) throw new Error('Failed to update product');
      
      toast.success('Product updated successfully!');
      router.push('/admin/products'); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="il-root" style={{ padding: '3.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--il-serif)', fontStyle: 'italic', color: 'var(--il-gold)' }}>
          Retrieving collection records...
        </p>
      </div>
    );
  }

  return (
    <div className="il-root" style={{ padding: '3.5rem 0' }}>
      
      <div style={{ maxWidth: '620px', margin: '0 auto 2rem auto', padding: '0 1rem' }}>
        <BackButton />
      </div>

      <div className="il-form-container">
        <header style={{ marginBottom: '3rem', textAlign: 'left' }}>
          <p className="il-eyebrow" style={{ margin: '0 0 0.5rem 0', letterSpacing: '0.25em' }}>
            Database Master Console
          </p>
          <h1 style={{ fontFamily: 'var(--il-serif)', fontSize: '32px', fontWeight: 300, color: 'var(--il-brand)', margin: 0 }}>
            Modify Collection Piece
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="il-form">
          <div className="il-field">
            <label className="il-label">Product Title</label>
            <input
              type="text"
              name="name"
              placeholder="e.g., Elegance Linen Table Runner"
              className="il-input"
              value={product.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="il-field">
            <label className="il-label">Editorial Description</label>
            <textarea
              name="description"
              placeholder="Describe the material characteristics..."
              className="il-textarea"
              value={product.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="il-field-row">
            <div className="il-field">
              <label className="il-label">Curated Category</label>
              <div className="il-select-wrapper">
                <select
                  name="category"
                  className="il-select"
                  value={product.category}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select Category</option>
                  <option value="Table Runners">Table Runners</option>
                  <option value="Bags">Bags</option>
                  <option value="Baby Shower Collection">Baby Shower Collection</option>
                  <option value="Keychain Collection">Keychain Collection</option>
                  <option value="Christmas Collection">Christmas Collection</option>
                </select>
              </div>
            </div>

            <div className="il-field">
              <label className="il-label">Retail Valuation (USD)</label>
              <input
                type="number"
                name="price"
                placeholder="0.00"
                step="0.01"
                className="il-input"
                value={product.price || ''} 
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="il-field-row">
            {/* ── SPLIT 'SIZE' FIELD INTO INDEPENDENT HEIGHT AND WIDTH CONTROLS ── */}
            <div className="il-field" style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="il-label">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  placeholder="e.g., 120"
                  step="0.01"
                  className="il-input"
                  value={product.height || ''}
                  onChange={handleChange}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="il-label">Width (cm)</label>
                <input
                  type="number"
                  name="width"
                  placeholder="e.g., 30"
                  step="0.01"
                  className="il-input"
                  value={product.width || ''}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* ── FILE UPLOAD INPUT FIELD ── */}
            <div className="il-field">
              <label className="il-label">Collection Artifact Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="il-input"
                style={{ padding: '0.4rem 0' }}
              />
              {product.image_url && !selectedFile && (
                <p style={{ fontSize: '11px', color: 'var(--il-gold)', fontStyle: 'italic', margin: '4px 0 0' }}>
                  An image asset is already linked. Upload a new file to replace it.
                </p>
              )}
            </div>
          </div>

          <div className="il-form-actions">
            <button type="button" onClick={handleCancel} className="il-btn-secondary">
              Discard Changes
            </button>
            <button type="submit" disabled={loading} className="il-btn-primary">
              {loading ? 'Uploading Asset...' : 'Update Artifact'}
            </button>
          </div>
        </form>
      </div>

      <footer className="il-footer" style={{ marginTop: '6rem' }}>
        <p>© {new Date().getFullYear()} Ilamaj · Internal Catalog Systems</p>
      </footer>
    </div>
  );
}