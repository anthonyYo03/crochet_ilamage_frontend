"use client";

import { useEffect, useId } from 'react';

interface ProductImageItem {
  image_id?: number;
  image_url: string;
  position?: number;
}

interface ProductCarouselProps {
  images?: ProductImageItem[];
  fallbackImageUrl?: string | null;
  altText: string;
  imgClassName?: string;
  placeholderClassName?: string;
}

export default function ProductCarousel({
  images,
  fallbackImageUrl,
  altText,
  imgClassName = 'il-detail-img',
  placeholderClassName = 'il-detail-placeholder',
}: ProductCarouselProps) {
  const rawId = useId();
  const carouselId = `carousel-${rawId.replace(/[:]/g, '')}`;

  // Bootstrap's carousel controls/indicators need the JS bundle loaded client-side
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js').catch(() => {
      // If the bootstrap package isn't installed yet, the carousel markup will
      // still render (first image visible), but controls won't be interactive.
    });
  }, []);

  const sortedImages = [...(images || [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );

  const displayImages =
    sortedImages.length > 0
      ? sortedImages
      : fallbackImageUrl
      ? [{ image_url: fallbackImageUrl }]
      : [];

  // No images at all — reuse the existing placeholder look
  if (displayImages.length === 0) {
    return (
      <div className={placeholderClassName}>
        <svg width="64" height="64" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ opacity: 0.15 }}>
          <path d="M4 16 C7 7 14 5 19 10 C22 13 21 19 24 19 C27 19 26 13 29 10 C34 5 41 7 44 16" stroke="#8B5E2F" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M4 16 C7 25 14 27 19 22 C22 19 21 13 24 13 C27 13 26 19 29 22 C34 27 41 25 44 16" stroke="#8B5E2F" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // Single image — no need for carousel chrome
  if (displayImages.length === 1) {
    return (
      <img src={displayImages[0].image_url} alt={altText} className={imgClassName} />
    );
  }

  // Multiple images — full Bootstrap carousel
  return (
    <div id={carouselId} className="carousel slide">
      <div className="carousel-indicators">
        {displayImages.map((img, index) => (
          <button
            key={img.image_id ?? index}
            type="button"
            data-bs-target={`#${carouselId}`}
            data-bs-slide-to={index}
            className={index === 0 ? 'active' : ''}
            aria-current={index === 0 ? 'true' : undefined}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>

      <div className="carousel-inner">
        {displayImages.map((img, index) => (
          <div key={img.image_id ?? index} className={`carousel-item ${index === 0 ? 'active' : ''}`}>
            <img src={img.image_url} alt={`${altText} - image ${index + 1}`} className={imgClassName} />
          </div>
        ))}
      </div>

      <button className="carousel-control-prev" type="button" data-bs-target={`#${carouselId}`} data-bs-slide="prev">
        <span className="carousel-control-prev-icon" aria-hidden="true" />
        <span className="visually-hidden">Previous</span>
      </button>
      <button className="carousel-control-next" type="button" data-bs-target={`#${carouselId}`} data-bs-slide="next">
        <span className="carousel-control-next-icon" aria-hidden="true" />
        <span className="visually-hidden">Next</span>
      </button>
    </div>
  );
}