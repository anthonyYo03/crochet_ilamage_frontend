"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ilamaj from "../image/ilmagePP.png";

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
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_LIMIT),
        });
        if (selectedCategory) params.set("category", selectedCategory);
        
        // Added search parameter logic
        if (searchTerm.trim() !== "") {
          params.set("search", searchTerm.trim());
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products/getAll?${params.toString()}`,
          { cache: "no-store" }
        );
        if (!response.ok) throw new Error("Failed to fetch products");
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

    // Added 500ms debounce for the search bar
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [page, selectedCategory, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, searchTerm]);

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
          {filteredProducts.map((product) => {
            const coverImage = product.images?.[0]?.image_url || product.image_url;

            return (
              <Link
                key={product.product_id}
                href={`/products/${product.product_id}`}
                className="il-card"
              >
                {coverImage ? (
                  <img src={coverImage} alt={product.name} className="il-card-img" />
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
            );
          })}
        </div>
      )}

      {/* ── CHANGED: pagination now only hides during active text search — category is server-paginated ── */}
      {!loading && !searchTerm && totalPages > 1 && (
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