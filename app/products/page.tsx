"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ilamaj from "../image/ilmagePP.png";

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
          { next: { revalidate: 60 } }
        );
        if (!response.ok) throw new Error("Failed to fetch products");
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
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (searchTerm.trim() !== "") {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower)
      );
    }
    setFilteredProducts(result);
  }, [searchTerm, selectedCategory, products]);

  const predefinedCategories = [
    "Table Runners",
    "Bags",
    "Baby Shower Collection",
    "Keychain Collection",
    "Christmas Collection",
  ];

  const uniqueCategories = Array.from(
    new Set([...predefinedCategories, ...products.map((p) => p.category)])
  ).filter(Boolean);

  return (
    <div className="il-root">
      
      <header className="il-hero">
        <p className="il-eyebrow">Lace crochet · handcrafted with love</p>

        {/* ── INCREASED DIMENSIONS TO 400px ── */}
        <div 
          className="il-knot" 
          style={{ 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center",
            width: "300px", 
            height: "300px", 
            margin: "0 auto 2.5rem auto"
          }}
        >
          <img 
            src={ilamaj.src} 
            alt="Ilamaj Logo" 
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "contain",
              borderRadius: "50%" 
            }} 
          />
        </div>

        <p className="il-tagline">
          Where every stitch carries a story of elegance, warmth, and enduring craft.
        </p>
        <p className="il-hero-desc">
          Timeless lace crochet pieces for your home, special occasions, and everyday beauty.
        </p>
      </header>

      
      <div className="il-search-wrap">
        <input
          type="text"
          className="il-search"
          placeholder="Search by title or description…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

     
      <nav className="il-cats">
        <button
          className={`il-cat ${selectedCategory === null ? "il-cat-active" : ""}`}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </button>
        {uniqueCategories.map((cat) => (
          <button
            key={cat}
            className={`il-cat ${selectedCategory === cat ? "il-cat-active" : ""}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

     
      <p className="il-section-label">Collection</p>

      
      {loading ? (
        <p className="il-empty">Loading collection…</p>
      ) : filteredProducts.length === 0 ? (
        <p className="il-empty">No pieces found matching your search.</p>
      ) : (
        <div className="il-grid">
          {filteredProducts.map((product) => (
            <Link
              key={product.product_id}
              href={`/products/${product.product_id}`}
              className="il-card"
            >
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="il-card-img" />
              ) : (
                <div className="il-card-placeholder">
                  <KnotPlaceholder />
                </div>
              )}
              <div className="il-card-body">
                <p className="il-card-cat">{product.category}</p>
                <p className="il-card-name">{product.name}</p>
                <p className="il-card-desc">{product.description}</p>
                <div className="il-card-footer">
               
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

      
      <div className="il-quote-strip">
        <p className="il-quote">
          "Each piece begins not with thread, but with an intention — to bring lasting beauty into your everyday life."
        </p>
        <p className="il-quote-attr">— Ilamaj, hand-made</p>
      </div>

      <footer className="il-footer">
        <p>© {new Date().getFullYear()} Ilamaj · All rights reserved</p>
      </footer>
    </div>
  );
}

function KnotPlaceholder() {
  return (
    <svg
      width="48"
      height="32"
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ opacity: 0.22 }}
    >
      <path
        d="M4 16 C7 7 14 5 19 10 C22 13 21 19 24 19 C27 19 26 13 29 10 C34 5 41 7 44 16"
        stroke="#8B5E2F"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4 16 C7 25 14 27 19 22 C22 19 21 13 24 13 C27 13 26 19 29 22 C34 27 41 25 44 16"
        stroke="#8B5E2F"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}