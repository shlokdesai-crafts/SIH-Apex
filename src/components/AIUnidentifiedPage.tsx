import { useTranslation } from '../i18n/useTranslation';
import { useState, useEffect } from 'react';
import './AIUnidentifiedPage.css';

const AIUnidentifiedPage = () => {
  const { t } = useTranslation();
  
  const defaultCases = [
    { id: '101', name: 'Tukaram Desai', location: 'Kolhapur', crop: 'Sugarcane', date: '2023-10-25', status: 'Pending Review', confidence: '45%' },
    { id: '102', name: 'Sanjay Patil', location: 'Satara', crop: 'Soybean', date: '2023-10-26', status: 'Pending Review', confidence: '32%' },
    { id: '103', name: 'Ramesh Kadam', location: 'Pune', crop: 'Tomato', date: '2023-10-26', status: 'Expert Assigned', confidence: '51%' },
    { id: '104', name: 'Vimal Shinde', location: 'Nashik', crop: 'Grapes', date: '2023-10-27', status: 'Pending Review', confidence: '28%' },
  ];

  const [cases, setCases] = useState(() => {
    const saved = localStorage.getItem('gov_portal_ai_unidentified');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultCases;
      }
    }
    return defaultCases;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('cropguard_history');
    if (saved) {
      try {
        const history = JSON.parse(saved);
        const unidentCases = history.filter((r: any) => r.confidence < 60 || r.severity === 'Unable to assess').map((r: any) => ({
          id: r.id.substring(0, 5),
          name: 'Local Farmer (App User)',
          location: 'Unknown location',
          crop: r.crop,
          date: new Date(r.date).toISOString().split('T')[0],
          status: 'Pending Review',
          confidence: r.confidence + '%',
          previewUrl: r.previewUrl
        }));
        
        if (unidentCases.length > 0) {
          setCases((prev: any[]) => {
            const newCases = unidentCases.filter((nc: any) => !prev.some(pc => pc.id === nc.id));
            const updated = [...newCases, ...prev];
            localStorage.setItem('gov_portal_ai_unidentified', JSON.stringify(updated));
            return updated;
          });
        }
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const handleAction = (id: string, newStatus: string) => {
    setCases((prev: any[]) => {
      const updated = prev.map(c => c.id === id ? { ...c, status: newStatus } : c);
      localStorage.setItem('gov_portal_ai_unidentified', JSON.stringify(updated));
      return updated;
    });
  };

  const filteredCases = cases.filter((c: any) => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.includes(searchQuery);
    const matchCrop = selectedCrop ? c.crop === selectedCrop : true;
    const matchStatus = selectedStatus ? c.status === selectedStatus : true;
    return matchSearch && matchCrop && matchStatus;
  });

  return (
    <div className="ai-unidentified-page page-layout fade-in">
      <div className="filters-bar">
        <input type="text" placeholder={t("Search by farmer name or case ID...")} className="gov-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <select className="gov-select" value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}>
          <option value="">{t("All Crops")}</option>
          <option value="Sugarcane">Sugarcane</option>
          <option value="Soybean">Soybean</option>
          <option value="Tomato">Tomato</option>
          <option value="Grapes">Grapes</option>
          <option value="Cotton">Cotton</option>
          <option value="Wheat">Wheat</option>
        </select>
        <select className="gov-select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
          <option value="">{t("All Statuses")}</option>
          <option value="Pending Review">Pending Review</option>
          <option value="Expert Assigned">Expert Assigned</option>
          <option value="Manually Diagnosed">Manually Diagnosed</option>
        </select>
      </div>

      <div className="ai-cases-grid">
        {filteredCases.map((c: any) => (
          <div key={c.id} className="ai-case-card gov-card">
            <div className="ai-case-image">
              {c.previewUrl ? (
                <img src={c.previewUrl} alt={c.crop} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="image-placeholder">
                  <span className="icon">📷</span>
                  <p>Crop Image</p>
                </div>
              )}
            </div>
            <div className="ai-case-details">
              <div className="ai-case-header">
                <h3>#{c.id} - {c.crop}</h3>
                <span className={`gov-status-badge ${c.status === 'Pending Review' ? 'danger' : c.status === 'Manually Diagnosed' ? 'success' : 'warning'}`}>
                  {c.status}
                </span>
              </div>
              <p><strong>{t("Farmer")}:</strong> {c.name}</p>
              <p><strong>{t("Location")}:</strong> {c.location}</p>
              <p><strong>{t("Date")}:</strong> {c.date}</p>
              <p><strong>{t("AI Confidence")}:</strong> <span className="text-danger">{c.confidence}</span></p>
              
              <div className="ai-case-actions">
                <button className="gov-action-btn primary full-width" onClick={() => handleAction(c.id, 'Manually Diagnosed')}>{t("Manual Diagnose")}</button>
                <button className="gov-action-btn outline full-width" onClick={() => handleAction(c.id, 'Expert Assigned')}>{t("Send to Expert")}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIUnidentifiedPage;
