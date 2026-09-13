import { useTranslation } from '../i18n/useTranslation';
import './AIAdvisoryPreview.css';
const AIAdvisoryPreview = () => {
  const {
    t
  } = useTranslation();
  return <div className="gov-card ai-advisory">
      <div className="gov-card-header">
        <h3 className="gov-card-title">{t("AI Analysis & Advisory Preview")}</h3>
      </div>
      <div className="ai-advisory-content">
        <div className="ai-advisory-image">
          {/* Placeholder for infected leaf image */}
          <div className="image-placeholder">
            <span>🍂</span>
          </div>
          <div className="gov-dept-logo">
            <span className="icon">🏛️</span>
            <div>
              <p>{t("Government of Maharashtra")}</p>
              <p>{t("Agriculture Department")}</p>
            </div>
          </div>
        </div>
        <div className="ai-advisory-details">
          <div className="ai-detected-issue">
            <h4>{t("Detected Issue")}</h4>
            <h2>{t("Leaf Blight")}<span>{t("(87% confidence)")}</span></h2>
            <p>{t("Crop: Cotton")}</p>
          </div>
          
          <div className="ai-recommended-actions">
            <h4>{t("Recommended Actions")}</h4>
            <ul>
              <li>
                <span className="action-icon">🧪</span>
                <strong>{t("Fertilizer:")}</strong>{t("Potassium (MOP) - 25 kg/acre")}</li>
              <li>
                <span className="action-icon">🧴</span>
                <strong>{t("Pesticide:")}</strong>{t("Mancozeb - 2.5 g/litre")}</li>
              <li>
                <span className="action-icon">✂️</span>
                <strong>{t("Other:")}</strong>{t("Remove infected leaves")}</li>
            </ul>
          </div>

          <button className="gov-btn-primary full-width">{t("View Full Advisory →")}</button>
        </div>
      </div>
    </div>;
};
export default AIAdvisoryPreview;