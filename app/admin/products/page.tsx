"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products/getAll`,
          {
            next: { revalidate: 60 },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch products`);
        }

        const data: ApiResponse = await response.json();
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    let result = products;

    if (selectedCategory) {
      result = result.filter((product) => product.category === selectedCategory);
    }

    if (searchTerm.trim() !== "") {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerSearchTerm) ||
          product.description.toLowerCase().includes(lowerSearchTerm)
      );
    }

    setFilteredProducts(result);
  }, [selectedCategory, searchTerm, products]);

  const staticCategories = ["Table Runners", "Bags", "Baby Shower Collection", "Kitchen Collection"];
  
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
          {filteredProducts.map((product) => (
            <Link 
              key={product.product_id} 
              href={`/admin/products/${product.product_id}`}
              className="il-card"
            >
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="il-card-img" />
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
                  {/* ── RENDERED HEIGHT AND WIDTH INSTEAD OF SIZE ── */}
                  <span className="il-card-size">
                    {product.height} cm x {product.width} cm
                  </span>
                  <span className="il-card-price">${Number(product.price).toFixed(2)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
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