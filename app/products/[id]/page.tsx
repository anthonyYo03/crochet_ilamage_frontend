import { notFound } from 'next/navigation';
import BackButton from '@/component/BackButton';
import ProductCarousel from '@/component/ProductCarousel';
import styles from './page.module.css';

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
  // ── SWAPPED 'size' WITH HEIGHT AND WIDTH ──
  height: number;
  width: number;
  image_url?: string;
  // ── ADDED MULTIPLE IMAGES SUPPORT ──
  images?: ProductImageItem[];
  is_active: boolean;
  user_id: number;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/getOne/${id}`, {
    next: { revalidate: 60 },
  });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.statusText}`);
  }

  const product: Product = await response.json();

  // ── DESIGN WHATSAPP LINK ──
  // Replace with your actual WhatsApp phone number (include your country code, no "+" or spaces)
  const phoneNumber = "96176797021";
  const shareMessage = `Hi! I would like to order the ${product.name}.`;
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(shareMessage)}`;

  return (
    <div className="il-root">
      <div className={styles['il-detail-nav']}>
        <BackButton />
      </div>

      <main className={styles['il-detail-container']}>
        {/* Left Side: Visual Frame ── NOW A BOOTSTRAP CAROUSEL ── */}
        <div className="il-detail-media">
          <ProductCarousel
            images={product.images}
            fallbackImageUrl={product.image_url}
            altText={product.name}
          />
        </div>

        {/* Right Side: Editorial Content Info */}
        <div className={styles['il-detail-content']}>
          <span className={styles['il-detail-cat']}>{product.category}</span>
          <h1 className={styles['il-detail-name']}>{product.name}</h1>
          <p className={styles['il-detail-price']}>${Number(product.price).toFixed(2)}</p>

          <div className={styles['il-detail-divider']} />

          <div className={styles['il-detail-meta']}>
            <span className={styles['il-detail-meta-label']}>Dimensions / Size</span>
            {/* ── RENDERED HEIGHT AND WIDTH WITH CM ANNOTATION ── */}
            <span className={styles['il-detail-meta-val']}>
              {product.height} cm x {product.width} cm
            </span>
          </div>

          <div className={styles['il-detail-divider']} />

          <div className={styles['il-detail-description-wrap']}>
            <h2 className={styles['il-detail-section-title']}>The Story & Craft</h2>
            <p className={styles['il-detail-desc']}>{product.description}</p>
          </div>
          
          {/* ── UPDATED ORDER ACTION BUTTON ── */}
          <div className={styles['il-detail-actions']}>
            <a 
              href={whatsappUrl}
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles['il-btn-whatsapp']}
            >
              Inquire via WhatsApp
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}