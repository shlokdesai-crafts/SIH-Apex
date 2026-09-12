import { useTranslation } from '../i18n/useTranslation';
import './GovSidebar.css';
interface GovSidebarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  isOpen?: boolean;
}
const GovSidebar = ({
  activeTab = 'dashboard',
  onSelectTab,
  isOpen = false
}: GovSidebarProps) => {
  const {
    t
  } = useTranslation();
  return <aside className={`gov-sidebar ${isOpen ? 'open' : ''}`}>
      <ul className="gov-sidebar-nav">
        <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => onSelectTab?.('dashboard')}>
          <span className="icon">🏠</span>{t("Dashboard")}</li>
        <li><span className="icon">📄</span>{t("Farmer Submissions")}</li>
        <li className={activeTab === 'operations-hub' ? 'active' : ''} onClick={() => onSelectTab?.('operations-hub')}>
          <span className="icon">🏢</span>{t("Operations Hub")}
        </li>
        <li className={activeTab === 'crop-health' ? 'active' : ''} onClick={() => onSelectTab?.('crop-health')}>
          <span className="icon">🌿</span>{t("Crop Health")}</li>
        <li><span className="icon">💡</span>{t("Advisories")}</li>
        <li><span className="icon">🏛️</span>{t("Schemes")}</li>
        <li><span className="icon">📑</span>{t("Reports")}</li>
        <li className={activeTab === 'team-management' ? 'active' : ''} onClick={() => onSelectTab?.('team-management')}>
          <span className="icon">👥</span>{t("Team Management")}
        </li>
        <li><span className="icon">⚙️</span>{t("Settings")}</li>
      </ul>
    </aside>;
};
export default GovSidebar;