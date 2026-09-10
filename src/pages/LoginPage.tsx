import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import { useTranslation } from '../i18n/useTranslation';

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('farmer');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(phone, password, role);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error || t('auth.loginFailed'));
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="auth-page">
      {/* Animated background leaves */}
      <div className="auth-bg-leaves">
        <div className="auth-leaf leaf-1">🌿</div>
        <div className="auth-leaf leaf-2">🍃</div>
        <div className="auth-leaf leaf-3">🌱</div>
        <div className="auth-leaf leaf-4">🌿</div>
        <div className="auth-leaf leaf-5">🍃</div>
      </div>

      <div className={`auth-card ${shake ? 'shake' : ''}`}>
        {/* Logo / Brand */}
        <div className="auth-brand">
          <div className="auth-logo">
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
              <ellipse cx="16" cy="22" rx="10" ry="7" fill="#2d8a3e" />
              <path d="M16 22 C12 14, 6 10, 10 4 C14 10, 22 8, 22 4 C24 10, 20 16, 16 22Z" fill="#4CAF50" />
              <path d="M16 22 C14 16, 10 12, 16 6 C16 12, 20 16, 16 22Z" fill="#81C784" opacity="0.7" />
            </svg>
          </div>
          <h1 className="auth-brand-name">{t('header.brand')}</h1>
          <p className="auth-brand-tagline">{t('header.subtitle')}</p>
        </div>

        <h2 className="auth-title">{t('auth.loginTitle')}</h2>
        <p className="auth-subtitle">{t('auth.loginSubtitle')}</p>

        {error && (
          <div className="auth-error" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Role Selection */}
          <div className="auth-field">
            <label className="auth-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              Account Type
            </label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input 
                  type="radio" 
                  name="role" 
                  value="farmer" 
                  checked={role === 'farmer'} 
                  onChange={(e) => setRole(e.target.value)} 
                  style={{ accentColor: '#2e7d32' }}
                />
                Farmer
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input 
                  type="radio" 
                  name="role" 
                  value="government" 
                  checked={role === 'government'} 
                  onChange={(e) => setRole(e.target.value)} 
                  style={{ accentColor: '#2e7d32' }}
                />
                Government
              </label>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="login-phone" className="auth-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              {t('auth.phone')}
            </label>
            <input
              id="login-phone"
              type="tel"
              placeholder={t('auth.phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="auth-input"
              maxLength={10}
              autoComplete="tel"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password" className="auth-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
              {t('auth.password')}
            </label>
            <div className="auth-password-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div className="auth-field">
            <label className="auth-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
              {t('auth.preferredLanguage')}
            </label>
            <div className="auth-lang-options">
              <label className={`auth-lang-radio ${language === 'en' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="language"
                  value="en"
                  checked={language === 'en'}
                  onChange={() => setLanguage('en')}
                />
                <span className="auth-lang-radio-dot"></span>
                <span>English</span>
              </label>
              <label className={`auth-lang-radio ${language === 'hi' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="language"
                  value="hi"
                  checked={language === 'hi'}
                  onChange={() => setLanguage('hi')}
                />
                <span className="auth-lang-radio-dot"></span>
                <span>हिंदी</span>
              </label>
              <label className={`auth-lang-radio ${language === 'mr' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="language"
                  value="mr"
                  checked={language === 'mr'}
                  onChange={() => setLanguage('mr')}
                />
                <span className="auth-lang-radio-dot"></span>
                <span>मराठी</span>
              </label>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="auth-btn-loading">
                <span className="auth-btn-spinner"></span>
                {t('auth.loggingIn')}
              </span>
            ) : (
              t('auth.loginBtn')
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {t('auth.noAccount')}{' '}
            <Link to="/signup" className="auth-link">{t('auth.signupLink')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
