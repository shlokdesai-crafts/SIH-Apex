import './RecentSubmissions.css';

const RecentSubmissions = () => {
  const submissions = [
    { id: 1, name: 'Ramesh Patil', location: 'Nashik', crop: 'Cotton', aiResult: 'Leaf Blight (87%)', status: 'Resolved', actionText: 'View Advice' },
    { id: 2, name: 'Savitri Jadhav', location: 'Jalgaon', crop: 'Soybean', aiResult: 'Healthy (92%)', status: 'Resolved', actionText: 'View Advice' },
    { id: 3, name: 'Mahesh Pawar', location: 'Latur', crop: 'Unknown', aiResult: 'Not Recognized', status: 'Needs Visit', actionText: 'Assign Officer' },
    { id: 4, name: 'Sunita Shinde', location: 'Beed', crop: 'Tur (Arhar)', aiResult: 'Possible Pest (60%)', status: 'Needs Visit', actionText: 'Assign Officer' },
    { id: 5, name: 'Vikas More', location: 'Nagpur', crop: 'Wheat', aiResult: 'Nutrient Deficiency', status: 'Resolved', actionText: 'View Advice' },
  ];

  return (
    <div className="gov-card recent-submissions">
      <div className="gov-card-header">
        <h3 className="gov-card-title">Recent Farmer Submissions</h3>
        <a href="#" className="gov-view-all">View All →</a>
      </div>
      
      <div className="gov-tabs">
        <button className="gov-tab active">All (12,842)</button>
        <button className="gov-tab">Pending (1,286)</button>
        <button className="gov-tab">Resolved (10,436)</button>
        <button className="gov-tab highlight">Unidentified (412)</button>
      </div>

      <div className="gov-table-container">
        <table className="gov-table">
          <thead>
            <tr>
              <th><input type="checkbox" /></th>
              <th>Image</th>
              <th>Farmer Name</th>
              <th>Location</th>
              <th>Crop</th>
              <th>AI Result</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => (
              <tr key={sub.id}>
                <td><input type="checkbox" /></td>
                <td>
                  <div className="gov-crop-img-placeholder">🍃</div>
                </td>
                <td className="gov-fw-500">{sub.name}</td>
                <td>{sub.location}</td>
                <td>{sub.crop}</td>
                <td>{sub.aiResult}</td>
                <td>
                  <span className={`gov-status-badge ${sub.status === 'Resolved' ? 'success' : 'warning'}`}>
                    {sub.status}
                  </span>
                </td>
                <td>
                  <button className={`gov-action-btn ${sub.status === 'Resolved' ? 'outline' : 'primary'}`}>
                    {sub.actionText}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentSubmissions;
