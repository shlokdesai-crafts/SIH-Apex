import { useTranslation } from '../i18n/useTranslation';
import { useState, useEffect } from 'react';
import './DistrictAnalyticsTable.css';

interface DistrictRow {
  name: string;
  total: number;
  resolved: number;
  needsVisit: number;
  unident: number;
}

const DistrictAnalyticsTable = () => {
  const { t } = useTranslation();
  const [districts, setDistricts] = useState<DistrictRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDistrictStats = async () => {
      try {
        const res = await fetch('/api/submissions?limit=300');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const distMap: Record<string, DistrictRow> = {};

            data.forEach((sub) => {
              const loc = sub.location || 'General';
              const distName = loc.split(',')[0].trim();
              if (!distMap[distName]) {
                distMap[distName] = {
                  name: distName,
                  total: 0,
                  resolved: 0,
                  needsVisit: 0,
                  unident: 0,
                };
              }

              const row = distMap[distName];
              row.total += 1;
              const s = (sub.status || '').toLowerCase();
              if (s === 'resolved') {
                row.resolved += 1;
              } else if (s === 'unidentified' || sub.disease === 'AI Unidentified') {
                row.unident += 1;
              } else {
                row.needsVisit += 1;
              }
            });

            const sorted = Object.values(distMap)
              .sort((a, b) => b.total - a.total)
              .slice(0, 7);

            setDistricts(sorted);
          }
        }
      } catch (e) {
        console.error('Error fetching district analytics:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchDistrictStats();
  }, []);

  return (
    <div className="gov-card district-analytics">
      <div className="gov-card-header">
        <h3 className="gov-card-title">{t("District-wise Case Analytics")}</h3>
        <span className="gov-view-all" style={{ fontSize: '0.8rem', color: '#64748b' }}>
          {t("Live Dynamic Metrics")}
        </span>
      </div>
      <div className="gov-table-container">
        {loading ? (
          <p style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
            {t("Calculating district metrics...")}
          </p>
        ) : districts.length === 0 ? (
          <p style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
            {t("No district data available.")}
          </p>
        ) : (
          <table className="gov-table text-right">
            <thead>
              <tr>
                <th className="text-left">{t("District")}</th>
                <th>{t("Total Scans")}</th>
                <th>{t("Resolved")}</th>
                <th className="text-danger">{t("Needs Visit")}</th>
                <th className="text-purple">{t("Unidentified")}</th>
              </tr>
            </thead>
            <tbody>
              {districts.map((d, i) => (
                <tr key={i}>
                  <td className="text-left gov-fw-500">📍 {d.name}</td>
                  <td>{d.total.toLocaleString()}</td>
                  <td>{d.resolved.toLocaleString()}</td>
                  <td className="text-danger">{d.needsVisit.toLocaleString()}</td>
                  <td className="text-purple">{d.unident.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DistrictAnalyticsTable;