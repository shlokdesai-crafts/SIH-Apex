import { useTranslation } from '../i18n/useTranslation';
import { useState, useEffect } from 'react';
import './NeedsVisitPage.css';

const NeedsVisitPage = () => {
  const { t } = useTranslation();
  
  const defaultCases = [
    { id: '1', name: 'Mahesh Pawar', location: 'Latur', district: 'Latur', status: 'Pending Visit', priority: 'High', date: '2023-10-24' },
    { id: '2', name: 'Rekha Gaikwad', location: 'Nanded', district: 'Nanded', status: 'Pending Visit', priority: 'Medium', date: '2023-10-25' },
    { id: '3', name: 'Suresh Mali', location: 'Dhule', district: 'Dhule', status: 'Pending Visit', priority: 'High', date: '2023-10-26' },
    { id: '4', name: 'Anil Sutar', location: 'Osmanabad', district: 'Osmanabad', status: 'Assigned', priority: 'Low', date: '2023-10-26' },
    { id: '5', name: 'Kavita More', location: 'Wardha', district: 'Wardha', status: 'Pending Visit', priority: 'High', date: '2023-10-27' },
  ];

  const [cases, setCases] = useState(() => {
    const saved = localStorage.getItem('gov_portal_needs_visit');
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
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedCase, setSelectedCase] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cropguard_history');
    if (saved) {
      try {
        const history = JSON.parse(saved);
        const needsVisitCases = history.filter((r: any) => r.severity === 'Severe' || r.disease === 'Diseased').map((r: any) => ({
          id: r.id.substring(0, 5),
          name: 'Local Farmer (App User)',
          location: 'Unknown location',
          district: 'Unknown',
          status: 'Pending Visit',
          priority: 'High',
          date: new Date(r.date).toISOString().split('T')[0]
        }));
        
        if (needsVisitCases.length > 0) {
          setCases((prev: any[]) => {
            const newCases = needsVisitCases.filter((nc: any) => !prev.some(pc => pc.id === nc.id));
            const updated = [...newCases, ...prev];
            localStorage.setItem('gov_portal_needs_visit', JSON.stringify(updated));
            return updated;
          });
        }
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const handleAssignStatus = (id: string) => {
    setCases((prev: any[]) => {
      const updated = prev.map(c => c.id === id ? { ...c, status: c.status === 'Assigned' ? 'Pending Visit' : 'Assigned' } : c);
      localStorage.setItem('gov_portal_needs_visit', JSON.stringify(updated));
      return updated;
    });
  };

  const filteredCases = cases.filter((c: any) => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.includes(searchQuery);
    const matchDistrict = selectedDistrict ? c.district === selectedDistrict : true;
    const matchPriority = selectedPriority ? c.priority === selectedPriority : true;
    return matchSearch && matchDistrict && matchPriority;
  });

  return (
    <div className="needs-visit-page page-layout fade-in">
      <div className="filters-bar">
        <input type="text" placeholder={t("Search by name or ID...")} className="gov-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <select className="gov-select" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
          <option value="">{t("All Districts")}</option>
          <option value="Latur">Latur</option>
          <option value="Nanded">Nanded</option>
          <option value="Dhule">Dhule</option>
          <option value="Osmanabad">Osmanabad</option>
          <option value="Wardha">Wardha</option>
          <option value="Unknown">Unknown</option>
        </select>
        <select className="gov-select" value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
          <option value="">{t("All Priorities")}</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      <div className="gov-card unident-cases full-page-table">
        <div className="gov-table-container">
          <table className="gov-table">
            <thead>
              <tr>
                <th>{t("Case ID")}</th>
                <th>{t("Farmer Name")}</th>
                <th>{t("District")}</th>
                <th>{t("Date Filed")}</th>
                <th>{t("Priority")}</th>
                <th>{t("Status")}</th>
                <th>{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c: any) => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td className="gov-fw-500">{c.name}</td>
                  <td>{c.district}</td>
                  <td>{c.date}</td>
                  <td>
                    <span className={`priority-badge ${c.priority.toLowerCase()}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td><span className={`gov-status-badge ${c.status === 'Assigned' ? 'success' : 'warning'}`}>{c.status}</span></td>
                  <td>
                    <button className="gov-action-btn outline small" onClick={() => handleAssignStatus(c.id)}>
                      {c.status === 'Assigned' ? t("Reassign") : t("Assign Official")}
                    </button>
                    <button className="gov-action-btn text small" style={{ marginLeft: '8px' }} onClick={() => setSelectedCase(c)}>
                      {t("View Details")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCase && (
        <div className="modal-overlay" onClick={() => setSelectedCase(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t("Case Details")} - #{selectedCase.id}</h3>
              <button className="close-btn" onClick={() => setSelectedCase(null)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>{t("Farmer Name")}:</strong> {selectedCase.name}</p>
              <p><strong>{t("Location")}:</strong> {selectedCase.location}</p>
              <p><strong>{t("District")}:</strong> {selectedCase.district}</p>
              {selectedCase.assignedOfficer && (
                <p><strong>{t("Assigned Officer")}:</strong> {selectedCase.assignedOfficer}</p>
              )}
              <p><strong>{t("Date Filed")}:</strong> {selectedCase.date}</p>
              <p><strong>{t("Priority")}:</strong> <span className={`priority-badge ${selectedCase.priority.toLowerCase()}`}>{selectedCase.priority}</span></p>
              <p><strong>{t("Status")}:</strong> <span className={`gov-status-badge ${selectedCase.status === 'Assigned' ? 'success' : 'warning'}`}>{selectedCase.status}</span></p>
            </div>
            <div className="modal-footer">
              <button className="gov-action-btn outline" onClick={() => setSelectedCase(null)}>{t("Close")}</button>
              <button className="gov-action-btn primary" onClick={() => {
                handleAssignStatus(selectedCase.id);
                setSelectedCase(null);
              }}>
                {selectedCase.status === 'Assigned' ? t("Reassign") : t("Assign Official")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NeedsVisitPage;
