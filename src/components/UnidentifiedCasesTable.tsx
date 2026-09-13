import { useTranslation } from '../i18n/useTranslation';
import './UnidentifiedCasesTable.css';
const UnidentifiedCasesTable = () => {
  const {
    t
  } = useTranslation();
  const cases = [{
    id: 1,
    name: 'Mahesh Pawar',
    location: 'Latur',
    status: 'Pending'
  }, {
    id: 2,
    name: 'Rekha Gaikwad',
    location: 'Nanded',
    status: 'Pending'
  }, {
    id: 3,
    name: 'Suresh Mali',
    location: 'Dhule',
    status: 'Pending'
  }, {
    id: 4,
    name: 'Anil Sutar',
    location: 'Osmanabad',
    status: 'Pending'
  }, {
    id: 5,
    name: 'Kavita More',
    location: 'Wardha',
    status: 'Pending'
  }];
  return <div className="gov-card unident-cases">
      <div className="gov-card-header">
        <h3 className="gov-card-title">{t("Unidentified Cases – Field Visit Required")}</h3>
        <a href="#" className="gov-view-all">{t("View All →")}</a>
      </div>
      <div className="gov-table-container">
        <table className="gov-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t("Farmer Name")}</th>
              <th>{t("Location")}</th>
              <th>{t("Image")}</th>
              <th>{t("Status")}</th>
              <th>{t("Assign")}</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c, index) => {
            const {
              t
            } = useTranslation();
            return <tr key={c.id}>
                <td>{index + 1}</td>
                <td className="gov-fw-500">{c.name}</td>
                <td>{c.location}</td>
                <td><div className="gov-crop-img-placeholder small">🍂</div></td>
                <td><span className="gov-status-badge warning">{c.status}</span></td>
                <td><button className="gov-action-btn outline">{t("Assign")}</button></td>
              </tr>;
          })}
          </tbody>
        </table>
      </div>
    </div>;
};
export default UnidentifiedCasesTable;