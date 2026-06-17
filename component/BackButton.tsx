'use client';

import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <>
      {/* Self-contained styling scoped directly to this button component */}
      <style jsx global>{`
        .il-back-btn {
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--il-sans, "Lato", sans-serif);
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--il-gold, #997545);
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .il-back-btn:hover {
          color: var(--il-brand, #664225);
        }

        .il-back-btn:hover .il-back-arrow {
          transform: translateX(-3px);
        }

        .il-back-arrow {
          font-size: 14px;
          line-height: 1;
          transition: transform 0.2s ease;
          /* Align the arrow perfectly with uppercase text */
          position: relative;
          top: -1px; 
        }
      `}</style>

      <button className="il-back-btn" onClick={() => router.back()}>
        <span className="il-back-arrow">←</span>
        <span>Back</span>
      </button>
    </>
  );
}