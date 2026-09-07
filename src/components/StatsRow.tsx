export default function StatsRow() {
  return (
    <section className="stats-row" id="stats-row">
      {/* Crop Health Score */}
      <div className="stat-card crop-health-card" id="crop-health-card">
        <div className="card-icon-col">
          <div className="green-leaf-icon">
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <path d="M16 28 C10 20, 4 14, 8 6 C12 16, 24 12, 24 4 C28 14, 22 24, 16 28Z" fill="#4CAF50" />
              <path d="M16 28 C14 20, 12 14, 16 8 C18 14, 20 20, 16 28Z" fill="#81C784" opacity="0.6" />
            </svg>
          </div>
        </div>
        <div className="card-content">
          <span className="card-label">Crop Health Score</span>
          <div className="score-row">
            <span className="score-value">78</span>
            <span className="score-denom">/ 100</span>
            <span className="score-change positive">▲ +12%</span>
          </div>
          <div className="score-change-note">vs last week</div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: '78%' }}></div>
          </div>
          <div className="card-note">Your crop is in good health</div>
        </div>
      </div>

      {/* Today's Risk Level */}
      <div className="stat-card risk-card" id="risk-card">
        <div className="risk-icon-col">
          <div className="risk-icon-circle">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            </svg>
          </div>
        </div>
        <div className="card-content">
          <span className="card-label">Today's Risk Level</span>
          <div className="risk-level-row">
            <span className="risk-level-text">Moderate</span>
            <span className="risk-up-arrow">↑</span>
          </div>
          <div className="risk-crop-row">Cotton • Bollworm</div>
          <div className="risk-warning">Risk increasing in next 3 days</div>
        </div>
      </div>

      {/* Weather Today */}
      <div className="stat-card weather-card" id="weather-card">
        <div className="weather-icon-col">
          <div className="weather-icon">
            <svg width="52" height="42" viewBox="0 0 52 42" fill="none">
              <circle cx="22" cy="16" r="10" fill="#FDD835" />
              <ellipse cx="32" cy="28" rx="14" ry="9" fill="#90CAF9" />
              <ellipse cx="22" cy="30" rx="10" ry="7" fill="#90CAF9" />
              <ellipse cx="38" cy="30" rx="8" ry="6" fill="#BBDEFB" />
            </svg>
          </div>
        </div>
        <div className="weather-main">
          <div className="weather-label-row">
            <span className="card-label">Weather Today</span>
          </div>
          <div className="weather-temp">28°C</div>
          <div className="weather-desc">Partly Cloudy</div>
        </div>
        <div className="weather-details">
          <div className="weather-detail-row">
            <span className="weather-detail-icon">💧</span>
            <span className="weather-detail-label">Humidity</span>
            <span className="weather-detail-value">72%</span>
          </div>
          <div className="weather-detail-row">
            <span className="weather-detail-icon">🌧</span>
            <span className="weather-detail-label">Rainfall</span>
            <span className="weather-detail-value">0 mm</span>
          </div>
          <div className="weather-detail-row">
            <span className="weather-detail-icon">💨</span>
            <span className="weather-detail-label">Wind</span>
            <span className="weather-detail-value">12 km/h</span>
          </div>
        </div>
      </div>
    </section>
  );
}
