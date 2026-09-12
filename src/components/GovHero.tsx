import { useTranslation } from '../i18n/useTranslation';
import './GovHero.css';
const GovHero = () => {
  const {
    t
  } = useTranslation();
  return <div className="gov-hero">
      <div className="gov-hero-content">
        <h1>{t("Maharashtra Agriculture Support Center")}</h1>
        <h2>{t("From Farmer's Photo to Real Solutions")}</h2>
        <p>{t("Monitor crop issues, guide farmers, and ensure healthier farms across Maharashtra.")}</p>
        <div className="gov-hero-meta">
          <span className="icon">📅</span>{t("Last updated: 09 Sep 2026 • 05:30 PM")}</div>
      </div>
      <div className="gov-hero-branding">
        <div className="gov-hero-badge">
          <span className="marathi-text">"शेतकऱ्यांच्या सोबत, सशक्त महाराष्ट्रासाठी"</span>
        </div>
        <div className="gov-hero-slogan">
          <h3>{t("Stronger Farmers")}</h3>
          <h3>{t("Greener Maharashtra")}</h3>
        </div>
      </div>
    </div>;
};
export default GovHero;