"use client";

import { FormEvent, useEffect, useState, use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { supabase } from '@/app/utils/supabase';
import BackButton from '@/component/BackButton';

interface ProductImageItem {
  image_id: number;
  image_url: string;
  position: number;
}

interface Product {
  product_id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  height: number;
  width: number;
  image_url?: string;
  images?: ProductImageItem[];
  is_active: boolean;
  user_id: number;
}

interface EditableFields {
  name: string;
  category: string;
  description: string;
  price: number;
  height: number;
  width: number;
}

interface ExistingImage {
  image_id: number;
  image_url: string;
}

interface NewImage {
  id: string;
  file: File;
  previewUrl: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  const [fields, setFields] = useState<EditableFields>({
    name: '',
    category: '',
    description: '',
    price: 0,
    height: 0,
    width: 0,
  });

  // ── EXISTING IMAGES LOADED FROM THE BACKEND, KEPT UNLESS REMOVED ──
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  // ── NEWLY SELECTED FILES TO BE UPLOADED ON SAVE ──
  const [newImages, setNewImages] = useState<NewImage[]>([]);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/getOne/${id}`);

        if (response.status === 404) {
          setNotFoundFlag(true);
          return;
        }

        if (!response.ok) throw new Error('Failed to fetch product data');

        const data: Product = await response.json();

        setFields({
          name: data.name,
          category: data.category,
          description: data.description,
          price: data.price,
          height: data.height,
          width: data.width,
        });

        const sortedImages = (data.images || [])
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((img) => ({ image_id: img.image_id, image_url: img.image_url }));

        // Fall back to legacy image_url if no images array is populated yet
        if (sortedImages.length === 0 && data.image_url) {
          setExistingImages([{ image_id: -1, image_url: data.image_url }]);
        } else {
          setExistingImages(sortedImages);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error loading piece');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  if (notFoundFlag) {
    notFound();
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFields((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'height' || name === 'width'
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleRemoveExistingImage = (image_id: number) => {
    setExistingImages((prev) => prev.filter((img) => img.image_id !== image_id));
  };

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles = Array.from(e.target.files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setNewImages((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleRemoveNewImage = (imgId: string) => {
    setNewImages((prev) => {
      const target = prev.find((img) => img.id === imgId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== imgId);
    });
  };

  const backButton = () => {
    router.back();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!fields.category) {
      toast.error('Please select a category');
      return;
    }

    if (existingImages.length === 0 && newImages.length === 0) {
      toast.error('Please keep or add at least one product image');
      return;
    }

    setSaving(true);

    try {
      // 1. Upload any newly added files to Supabase Storage
      const uploadedUrls: string[] = [];

      for (const { file } of newImages) {
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

      // 2. Merge remaining existing image URLs with newly uploaded ones, preserving order
      const finalImages = [
        ...existingImages.map((img) => img.image_url),
        ...uploadedUrls,
      ];

      // 3. Send the update, including the full replacement 'images' array
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/edit/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...fields,
          images: finalImages,
        }),
      });

      if (!response.ok) throw new Error('Failed to update product record');

      toast.success('Product updated successfully!');
      newImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      router.push(`/admin/products/${id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="il-root" style={{ padding: '3.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--il-serif)', fontStyle: 'italic', color: 'var(--il-gold)' }}>Loading collection details...</p>
      </div>
    );
  }

  return (
    <div className="il-root" style={{ padding: '3.5rem 0' }}>
      <div style={{ maxWidth: '620px', margin: '0 auto 2rem auto', padding: '0 1rem' }}>
        <BackButton />
      </div>

      <header className="il-hero" style={{ paddingBottom: '2rem' }}>
        <p className="il-eyebrow">Studio Inventory</p>
        <h1 className="il-brand-name">Edit Piece</h1>
        <p className="il-brand-sub">Update this item in the active collection</p>
      </header>

      <div className="il-form-container">
        <form onSubmit={handleSubmit} className="il-form">

          <div className="il-field">
            <label className="il-label">Product Title</label>
            <input
              type="text"
              name="name"
              className="il-input"
              value={fields.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="il-field">
            <label className="il-label">Collection Group</label>
            <div className="il-select-wrapper">
              <select
                name="category"
                className="il-select"
                value={fields.category}
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

          <div className="il-field-row">
            <div className="il-field">
              <label className="il-label">Price ($ USD)</label>
              <input
                type="number"
                name="price"
                className="il-input"
                step="0.01"
                value={fields.price || ''}
                onChange={handleChange}
                required
              />
            </div>

            <div className="il-field" style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="il-label">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  className="il-input"
                  step="0.01"
                  value={fields.height || ''}
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
                  step="0.01"
                  value={fields.width || ''}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* ── EXISTING + NEW IMAGE MANAGEMENT ── */}
          <div className="il-field">
            <label className="il-label">Product Presentation Images</label>

            {existingImages.length > 0 && (
              <>
                <p style={{ fontSize: '11px', opacity: 0.6, margin: '0.25rem 0' }}>Current images</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  {existingImages.map((img, index) => (
                    <div
                      key={img.image_id}
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
                        src={img.image_url}
                        alt={`Existing product image ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(img.image_id)}
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
              </>
            )}

            <input
              type="file"
              accept="image/*"
              multiple
              className="il-input"
              style={{ padding: '0.4rem 0' }}
              onChange={handleAddFiles}
            />

            {newImages.length > 0 && (
              <>
                <p style={{ fontSize: '11px', opacity: 0.6, margin: '0.75rem 0 0.25rem' }}>New images to upload</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {newImages.map((img) => (
                    <div
                      key={img.id}
                      style={{
                        position: 'relative',
                        width: '84px',
                        height: '84px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '1px dashed var(--il-gold, #8B5E2F)',
                      }}
                    >
                      <img
                        src={img.previewUrl}
                        alt="New image preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(img.id)}
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
              </>
            )}

            <p style={{ fontSize: '11px', opacity: 0.6, marginTop: '0.5rem' }}>
              The first image (left-most, current then new) will be used as the main thumbnail.
            </p>
          </div>

          <div className="il-field">
            <label className="il-label">Design Details</label>
            <textarea
              name="description"
              className="il-textarea"
              value={fields.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="il-form-actions">
            <button type="button" className="il-btn-secondary" onClick={backButton}>
              Cancel
            </button>
            <button type="submit" className="il-btn-primary" disabled={saving}>
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>

      <footer className="il-footer" style={{ marginTop: '5rem' }}>
        <p>© {new Date().getFullYear()} Ilamaj · Internal Management System</p>
      </footer>
    </div>
  );
}