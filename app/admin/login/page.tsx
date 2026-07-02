"use client";

import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface LoginUser {
  email: string;
  password: string;
}
// triggering vercel
export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<LoginUser>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Toggle state

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      toast.success('Logged in successfully!');
      router.push('/admin/products');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="il-root" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', padding: '2rem 0' }}>
      
      <div className="il-form-container" style={{ marginTop: '0' }}>
        
        {/* ── HEADING EDITORIAL BRANDING ── */}
        <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <p className="il-eyebrow" style={{ margin: '0 0 0.6rem 0', letterSpacing: '0.34em' }}>
            System Gateway
          </p>
          <h1 style={{ fontFamily: 'var(--il-serif)', fontSize: '38px', fontWeight: 300, color: 'var(--il-brand)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>
            Ilamaj
          </h1>
          <p style={{ fontFamily: 'var(--il-serif)', fontSize: '11px', fontWeight: 300, letterSpacing: '0.4em', color: 'var(--il-gold)', textTransform: 'uppercase', margin: '8px 0 0 0' }}>
            Internal Catalog Systems
          </p>
        </header>

        {/* ── LOGIN FORM MATRIX ── */}
        <form onSubmit={handleSubmit} className="il-form" style={{ gap: '2.5rem' }}>
          
          {/* Email Field */}
          <div className="il-field">
            <label className="il-label">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="admin@ilamaj.com"
              className="il-input"
              value={credentials.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password Field with Inline Eye Toggle */}
          <div className="il-field">
            <label className="il-label">Security Password</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••••••"
                className="il-input"
                value={credentials.password}
                onChange={handleChange}
                required
                style={{ width: '100%', paddingRight: '2.5rem' }} // Leave room for the button
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{
                  position: 'absolute',
                  right: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.4,
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  /* Eye Slash Icon */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  /* Eye Icon */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* ── SUBMIT BUTTON ACTION ── */}
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
            <button 
              type="submit" 
              disabled={loading} 
              className="il-btn-primary" 
              style={{ width: '100%', padding: '1.1rem 2.5rem' }}
            >
              {loading ? 'Authenticating...' : 'Enter Console'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}