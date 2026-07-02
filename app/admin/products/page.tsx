"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

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
  image_url: string;
  images?: ProductImageItem[];
  is_active: boolean;
  user_id: number;
}

interface ApiResponse {
  total: number;
  page: number;
  totalPages: number;
  products: Product[];
}

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_LIMIT = 20;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // ── category is now sent to the backend so filtering happens at the DB level,
        // otherwise only whatever products are on the current page get filtered client-side ──
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_LIMIT),
        });
        if (selectedCategory) params.set("category", selectedCategory);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products/getAll?${params.toString()}`,
          {
            cache: 'no-store',
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch products`);
        }

        const data: ApiResponse = await response.json();
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, selectedCategory]);

  useEffect(() => {
    // ── category filtering is now handled server-side (see fetch above),
    // so this effect only applies the text search on top of the fetched page ──
    let result = products;

    if (searchTerm.trim() !== "") {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerSearchTerm) ||
          product.description.toLowerCase().includes(lowerSearchTerm)
      );
    }

    setFilteredProducts(result);
  }, [searchTerm, products]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, searchTerm]);

  const staticCategories = ["Table Runners", "Bags", "Baby Shower Collection","Keychain Collection", "Christmas Collection"];
 
  const uniqueCategories = Array.from(
    new Set([
      ...staticCategories,
      ...products.map((p) => p.category)
    ])
  ).filter((cat) => cat);

  if (loading) {
    return (
      <div className="il-root">
        <p className="il-empty">Loading inventory database…</p>
      </div>
    );
  }

  return (
    <div className="il-root">
      {/* ── HEADER AREA ── */}
      <header className="il-hero" style={{ paddingBottom: '2.5rem' }}>
        <p className="il-eyebrow">Management Portal</p>
        <h1 className="il-brand-name">Collection Index</h1>
        <p className="il-brand-sub">Ilamaj · Inventory</p>
      </header>

      {/* ── SEARCH INPUT ── */}
      <div className="il-search-wrap">
        <input
          type="text"
          className="il-search"
          placeholder="Search items by title or description…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ── DYNAMIC CATEGORY CONTROLS ── */}
      <nav className="il-cats">
        <button
          className={`il-cat ${selectedCategory === null ? "il-cat-active" : ""}`}
          onClick={() => setSelectedCategory(null)}
        >
          All Pieces
        </button>
        {uniqueCategories.map((category) => (
          <button
            key={category}
            className={`il-cat ${selectedCategory === category ? "il-cat-active" : ""}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </nav>

      <p className="il-section-label">Active Database Entries</p>

      {/* ── ADAPTED ITEM GRID / EMPTY STATE ── */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p className="il-empty">No products found in the collection.</p>
        </div>
      ) : (
        <div className="il-grid">
          {filteredProducts.map((product) => {
            const coverImage = product.images?.[0]?.image_url || product.image_url;

            return (
              <Link
                key={product.product_id}
                href={`/admin/products/${product.product_id}`}
                className="il-card"
              >
                {coverImage ? (
                  <img src={coverImage} alt={product.name} className="il-card-img" />
                ) : (
                  <div className="il-card-placeholder">
                    <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ opacity: 0.22 }}>
                      <path d="M4 16 C7 7 14 5 19 10 C22 13 21 19 24 19 C27 19 26 13 29 10 C34 5 41 7 44 16" stroke="#8B5E2F" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M4 16 C7 25 14 27 19 22 C22 19 21 13 24 13 C27 13 26 19 29 22 C34 27 41 25 44 16" stroke="#8B5E2F" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
                <div className="il-card-body">
                  <p className="il-card-cat">{product.category}</p>
                  <h2 className="il-card-name">{product.name}</h2>
                  <p className="il-card-desc">{product.description}</p>
                  <div className="il-card-footer">
                    <span className="il-card-size">
                      {product.height} cm x {product.width} cm
                    </span>
                    <span className="il-card-price">${Number(product.price).toFixed(2)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── PAGINATION CONTROLS (hidden during active text search, since search is still client-side on the current page) ── */}
      {!searchTerm && totalPages > 1 && (
        <nav className="il-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2.5rem' }}>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="il-cat"
            style={{ opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            Previous
          </button>
          <span className="il-section-label" style={{ margin: 0 }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="il-cat"
            style={{ opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </nav>
      )}

      {/* ── FLOATING ACTION CREATION ENTRY BUTTON ── */}
      <Link href="/admin/products/create" className="il-admin-float-wrap">
        <button type="button" className="il-admin-add-btn" aria-label="Create New Product">+</button>
      </Link>

      <footer className="il-footer" style={{ marginTop: '4rem' }}>
        <p>© {new Date().getFullYear()} Ilamaj · Systems Catalog Management</p>
      </footer>
    </div>
  );
}