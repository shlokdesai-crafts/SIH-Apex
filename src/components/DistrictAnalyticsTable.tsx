import './DistrictAnalyticsTable.css';

const DistrictAnalyticsTable = () => {
  const districts = [
    { name: 'Nashik', total: '1,842', resolved: '1,520', needsVisit: 210, unident: 112 },
    { name: 'Pune', total: '1,620', resolved: '1,420', needsVisit: 150, unident: 50 },
    { name: 'Jalgaon', total: '1,280', resolved: '980', needsVisit: 220, unident: 80 },
    { name: 'Latur', total: '1,060', resolved: '720', needsVisit: 260, unident: 80 },
    { name: 'Nagpur', total: '980', resolved: '860', needsVisit: 80, unident: 40 },
    { name: 'Beed', total: '840', resolved: '640', needsVisit: 160, unident: 40 },
  ];

  return (
    <div className="gov-card district-analytics">
      <div className="gov-card-header">
        <h3 className="gov-card-title">District-wise Cases</h3>
        <a href="#" className="gov-view-all">View All →</a>
      </div>
      <div className="gov-table-container">
        <table className="gov-table text-right">
          <thead>
            <tr>
              <th className="text-left">District</th>
              <th>Total</th>
              <th>Resolved</th>
              <th className="text-danger">Needs Visit</th>
              <th className="text-purple">Unidentified</th>
            </tr>
          </thead>
          <tbody>
            {districts.map((d, i) => (
              <tr key={i}>
                <td className="text-left gov-fw-500">{d.name}</td>
                <td>{d.total}</td>
                <td>{d.resolved}</td>
                <td className="text-danger">{d.needsVisit}</td>
                <td className="text-purple">{d.unident}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DistrictAnalyticsTable;
