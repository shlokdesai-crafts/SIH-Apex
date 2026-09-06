import React from 'react';

export default function Hero() {
  return (
    <section className="hero" id="hero-section">
      <div className="hero-overlay"></div>
      <div className="hero-left">
        <p className="hero-namaskar">Namaskar,</p>
        <h1 className="hero-name">Ramesh Patil <span className="leaf-emoji">🌿</span></h1>
        <p className="hero-tagline">Your crops. Our AI. A healthier tomorrow.</p>
        <div className="hero-quote-box">
          <div className="quote-mark-col">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#2d7d3a">
              <text x="0" y="20" fontSize="26" fontFamily="Georgia,serif">&ldquo;</text>
            </svg>
          </div>
          <div className="quote-body">
            <span className="quote-text">"समृद्ध शेती, समृद्ध महाराष्ट्र."</span>
            <span className="quote-author">— CropGuard</span>
          </div>
        </div>
      </div>

      <div className="hero-center">
        <img src="images/farmer_hero.jpg.png" alt="Farmer using CropGuard app" className="hero-farmer-img" id="hero-farmer-img" />
      </div>

      <div className="hero-right">
        <div className="hero-slogan-main">
          <span className="hero-slogan-from">From</span>
          <span className="hero-slogan-our">Our Fields</span>
          <div className="hero-slogan-leaf-row">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <path d="M16 28 C12 20, 4 16, 8 6 C12 14, 24 10, 24 4 C26 12, 22 22, 16 28Z" fill="#4CAF50" />
              <path d="M16 28 C14 20, 14 14, 16 8 C18 14, 18 20, 16 28Z" fill="#81C784" opacity="0.7" />
            </svg>
          </div>
          <span className="hero-slogan-to">to a Healthier</span>
          <span className="hero-slogan-tomorrow">Tomorrow</span>
          <div className="hero-underline"></div>
        </div>
        <div className="hero-slogan-right-text">
          <p>Stronger</p>
          <p>Farmers</p>
          <p>Greener</p>
          <p>Maharashtra</p>
          <div className="hero-right-underline"></div>
        </div>
      </div>
    </section>
  );
}
