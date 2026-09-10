import './GovHero.css';

const GovHero = () => {
  return (
    <div className="gov-hero">
      <div className="gov-hero-content">
        <h1>Maharashtra Agriculture Support Center</h1>
        <h2>From Farmer's Photo to Real Solutions</h2>
        <p>Monitor crop issues, guide farmers, and ensure healthier farms across Maharashtra.</p>
        <div className="gov-hero-meta">
          <span className="icon">📅</span> Last updated: 09 Sep 2026 • 05:30 PM
        </div>
      </div>
      <div className="gov-hero-branding">
        <div className="gov-hero-badge">
          <span className="marathi-text">"शेतकऱ्यांच्या सोबत, सशक्त महाराष्ट्रासाठी"</span>
        </div>
        <div className="gov-hero-slogan">
          <h3>Stronger Farmers</h3>
          <h3>Greener Maharashtra</h3>
        </div>
      </div>
    </div>
  );
};

export default GovHero;
