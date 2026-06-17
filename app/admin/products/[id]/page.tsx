'use client';

import { useEffect, useState, use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast'; // Adjust based on your actual toast library
import BackButton from '@/component/BackButton';

interface Product {
  product_id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  // ── SWAPPED 'size' WITH HEIGHT AND WIDTH ──
  height: number;
  width: number;
  image_url: string;
  is_active: boolean;
  user_id: number;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: Props) {
  // Unwrap the Next.js async params safe hook wrapper
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Fetch product data on client mount
  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/getOne/${id}`);
        
        if (response.status === 404) {
          notFound();
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch product data');
        }

        const data: Product = await response.json();
        setProduct(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error loading piece');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  // Handle Administrative Delete
  const handleDelete = async () => {
    const confirmDelete = confirm("Are you sure you want to delete this product? This action cannot be undone.");
    if (!confirmDelete) return;

    setDeleting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/delete/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      }

      if (!response.ok) throw new Error('Failed to delete product');

      toast.success('Product deleted successfully!');
      router.push('/admin/products'); // Redirect back to product catalog matrix
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  // Loading state placeholder matching background palette colors
  if (loading) {
    return (
      <div className="il-root" style={{ padding: '3.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--il-serif)', fontStyle: 'italic', color: 'var(--il-gold)' }}>Loading collection details...</p>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="il-root" style={{ padding: '3.5rem 0' }}>
      {/* ── TOP ACTION BAR ── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto 3rem auto', padding: '0 1.5rem' }}>
        <BackButton />
      </div>

      {/* ── TWO-COLUMN DETAIL LAYOUT ── */}
      <div className="il-detail-layout">
        
        {/* Left Column: Media Presentation */}
        <div className="il-detail-media">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="il-detail-img" />
          ) : (
            <div className="il-detail-placeholder">
              <svg width="64" height="64" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ opacity: 0.15 }}>
                <path d="M4 16 C7 7 14 5 19 10 C22 13 21 19 24 19 C27 19 26 13 29 10 C34 5 41 7 44 16" stroke="#8B5E2F" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M4 16 C7 25 14 27 19 22 C22 19 21 13 24 13 C27 13 26 19 29 22 C34 27 41 25 44 16" stroke="#8B5E2F" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>

        {/* Right Column: Editorial Data Sheet */}
        <div className="il-detail-info">
          <header className="il-detail-header">
            <p className="il-detail-cat">{product.category}</p>
            <h1 className="il-detail-title">{product.name}</h1>
            <p className="il-detail-price">${Number(product.price).toFixed(2)}</p>
          </header>

          <div className="il-detail-body">
            <h3 className="il-detail-section-title">Design Specs</h3>
            <p className="il-detail-desc">{product.description}</p>
            
            <div className="il-detail-meta-row">
              <span className="il-detail-meta-label">Dimensions</span>
              {/* ── RENDERED HEIGHT AND WIDTH WITH CM ANNOTATION ── */}
              <span className="il-detail-meta-value">
                {product.height} cm x {product.width} cm
              </span>
            </div>
          </div>

          {/* Administrative Form Routing Actions */}
          <div className="il-admin-actions" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link href={`/admin/products/edit/${id}`} className="il-btn-admin-edit">
              Edit Collection Piece
            </Link>
            
            <button 
              onClick={handleDelete} 
              disabled={deleting}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem',
                fontFamily: 'var(--il-sans, sans-serif)',
                fontSize: '10px',
                fontWeight: 400,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#a34848',
                cursor: deleting ? 'not-allowed' : 'pointer',
                textAlign: 'center',
                opacity: deleting ? 0.6 : 1,
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#732626')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#a34848')}
            >
              {deleting ? 'Removing Piece...' : 'Delete Piece'}
            </button>
          </div>
        </div>

      </div>

      <footer className="il-footer" style={{ marginTop: '6rem' }}>
        <p>© {new Date().getFullYear()} Ilamaj · Internal Catalog Systems</p>
      </footer>
    </div>
  );
}