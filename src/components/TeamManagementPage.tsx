import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import './TeamManagementPage.css';

interface Officer {
  id: string;
  name: string;
  role: string;
  district: string;
}

const mockOfficers: Officer[] = [
  { id: 'off_1', name: 'Rajesh Patil', role: 'Agriculture Extension Officer', district: 'Pune' },
  { id: 'off_2', name: 'Sneha Deshmukh', role: 'District Agriculture Officer', district: 'Nashik' },
  { id: 'off_3', name: 'Vikram Joshi', role: 'Field Inspector', district: 'Satara' },
  { id: 'off_4', name: 'Priya Kadam', role: 'Agronomist', district: 'Kolhapur' },
  { id: 'off_5', name: 'Amit Shinde', role: 'Crop Health Specialist', district: 'Latur' },
  { id: 'off_6', name: 'Kavita Chavan', role: 'Field Inspector', district: 'Pune' },
];

const mockInitialReceived = [
  { id: 'off_7', name: 'Sanjay More', role: 'Agriculture Extension Officer', district: 'Dhule' },
];

const TeamManagementPage = () => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'network' | 'pending' | 'discover'>('network');
  
  const [connections, setConnections] = useState<Officer[]>(() => {
    const saved = localStorage.getItem('gov_team_connections');
    return saved ? JSON.parse(saved) : [];
  });

  const [sentRequests, setSentRequests] = useState<string[]>(() => {
    const saved = localStorage.getItem('gov_team_sent');
    return saved ? JSON.parse(saved) : [];
  });

  const [receivedRequests, setReceivedRequests] = useState<Officer[]>(() => {
    const saved = localStorage.getItem('gov_team_received');
    return saved ? JSON.parse(saved) : mockInitialReceived;
  });

  // Sync to local storage on change
  useEffect(() => {
    localStorage.setItem('gov_team_connections', JSON.stringify(connections));
  }, [connections]);

  useEffect(() => {
    localStorage.setItem('gov_team_sent', JSON.stringify(sentRequests));
  }, [sentRequests]);

  useEffect(() => {
    localStorage.setItem('gov_team_received', JSON.stringify(receivedRequests));
  }, [receivedRequests]);

  const handleSendRequest = (officerId: string) => {
    if (!sentRequests.includes(officerId)) {
      setSentRequests([...sentRequests, officerId]);
    }
  };

  const handleAcceptRequest = (officer: Officer) => {
    setReceivedRequests(prev => prev.filter(req => req.id !== officer.id));
    if (!connections.find(c => c.id === officer.id)) {
      setConnections(prev => [...prev, officer]);
    }
  };

  const handleRejectRequest = (officerId: string) => {
    setReceivedRequests(prev => prev.filter(req => req.id !== officerId));
  };

  const handleRemoveConnection = (officerId: string) => {
    setConnections(prev => prev.filter(c => c.id !== officerId));
  };

  return (
    <div className="team-management-page page-layout fade-in">
      <div className="page-header">
        <h2 className="page-title">{t("Team Management")}</h2>
        <p className="page-subtitle">{t("Connect and collaborate with other government officers.")}</p>
      </div>

      <div className="team-tabs">
        <button 
          className={`team-tab ${activeTab === 'network' ? 'active' : ''}`}
          onClick={() => setActiveTab('network')}
        >
          {t("My Network")} ({connections.length})
        </button>
        <button 
          className={`team-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          {t("Pending Requests")} {receivedRequests.length > 0 && <span className="badge danger">{receivedRequests.length}</span>}
        </button>
        <button 
          className={`team-tab ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          {t("Discover Officers")}
        </button>
      </div>

      <div className="team-content">
        {activeTab === 'network' && (
          <div className="network-section fade-in">
            {connections.length === 0 ? (
              <div className="empty-state">
                <span className="icon">👥</span>
                <p>{t("You haven't added anyone to your network yet.")}</p>
                <button className="gov-action-btn outline" onClick={() => setActiveTab('discover')}>{t("Discover Officers")}</button>
              </div>
            ) : (
              <div className="officer-grid">
                {connections.map(officer => (
                  <div key={officer.id} className="officer-card gov-card">
                    <div className="officer-avatar">{officer.name.charAt(0)}</div>
                    <div className="officer-info">
                      <h3>{officer.name}</h3>
                      <p className="role">{officer.role}</p>
                      <p className="district">📍 {officer.district}</p>
                    </div>
                    <div className="officer-actions">
                      <button className="gov-action-btn primary full-width" style={{marginBottom: '8px'}}>{t("Message")}</button>
                      <button className="gov-action-btn text text-danger full-width" onClick={() => handleRemoveConnection(officer.id)}>{t("Remove")}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="pending-section fade-in">
            <div className="pending-column">
              <h3 className="section-title">{t("Received Requests")} ({receivedRequests.length})</h3>
              {receivedRequests.length === 0 ? (
                <p className="text-muted">{t("No pending incoming requests.")}</p>
              ) : (
                <div className="officer-list">
                  {receivedRequests.map(officer => (
                    <div key={officer.id} className="officer-list-item gov-card">
                      <div className="officer-info-row">
                        <div className="officer-avatar small">{officer.name.charAt(0)}</div>
                        <div>
                          <h4>{officer.name}</h4>
                          <p>{officer.role} • {officer.district}</p>
                        </div>
                      </div>
                      <div className="action-row">
                        <button className="gov-action-btn primary small" onClick={() => handleAcceptRequest(officer)}>{t("Accept")}</button>
                        <button className="gov-action-btn text small text-danger" onClick={() => handleRejectRequest(officer.id)}>{t("Reject")}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pending-column">
              <h3 className="section-title">{t("Sent Requests")} ({sentRequests.length})</h3>
              {sentRequests.length === 0 ? (
                <p className="text-muted">{t("No pending sent requests.")}</p>
              ) : (
                <div className="officer-list">
                  {mockOfficers.filter(o => sentRequests.includes(o.id)).map(officer => (
                    <div key={officer.id} className="officer-list-item gov-card">
                      <div className="officer-info-row">
                        <div className="officer-avatar small bg-gray">{officer.name.charAt(0)}</div>
                        <div>
                          <h4>{officer.name}</h4>
                          <p>{officer.role} • {officer.district}</p>
                        </div>
                      </div>
                      <span className="gov-status-badge warning">{t("Pending")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="discover-section fade-in">
            <div className="officer-grid">
              {mockOfficers
                .filter(o => !connections.find(c => c.id === o.id))
                .map(officer => {
                const isSent = sentRequests.includes(officer.id);
                return (
                  <div key={officer.id} className="officer-card gov-card">
                    <div className="officer-avatar">{officer.name.charAt(0)}</div>
                    <div className="officer-info">
                      <h3>{officer.name}</h3>
                      <p className="role">{officer.role}</p>
                      <p className="district">📍 {officer.district}</p>
                    </div>
                    <div className="officer-actions">
                      <button 
                        className={`gov-action-btn full-width ${isSent ? 'outline' : 'primary'}`}
                        disabled={isSent}
                        onClick={() => handleSendRequest(officer.id)}
                      >
                        {isSent ? t("Request Sent") : t("Connect")}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagementPage;
