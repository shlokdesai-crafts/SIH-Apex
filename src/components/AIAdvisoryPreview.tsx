import './AIAdvisoryPreview.css';

const AIAdvisoryPreview = () => {
  return (
    <div className="gov-card ai-advisory">
      <div className="gov-card-header">
        <h3 className="gov-card-title">AI Analysis & Advisory Preview</h3>
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
              <p>Government of Maharashtra</p>
              <p>Agriculture Department</p>
            </div>
          </div>
        </div>
        <div className="ai-advisory-details">
          <div className="ai-detected-issue">
            <h4>Detected Issue</h4>
            <h2>Leaf Blight <span>(87% confidence)</span></h2>
            <p>Crop: Cotton</p>
          </div>
          
          <div className="ai-recommended-actions">
            <h4>Recommended Actions</h4>
            <ul>
              <li>
                <span className="action-icon">🧪</span>
                <strong>Fertilizer:</strong> Potassium (MOP) - 25 kg/acre
              </li>
              <li>
                <span className="action-icon">🧴</span>
                <strong>Pesticide:</strong> Mancozeb - 2.5 g/litre
              </li>
              <li>
                <span className="action-icon">✂️</span>
                <strong>Other:</strong> Remove infected leaves
              </li>
            </ul>
          </div>

          <button className="gov-btn-primary full-width">
            View Full Advisory →
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisoryPreview;
