import { useTranslation } from '../i18n/useTranslation';
import './Login.css';
import { useState } from 'react';
interface LoginProps {
  onLogin: (role: string) => void;
}
const Login = ({
  onLogin
}: LoginProps) => {
  const {
    t
  } = useTranslation();
  const [role, setRole] = useState('farmer');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(role);
  };
  return <div className="login-container">
      <div className="login-card">
        <h2>{t("Welcome to SIH Apex")}</h2>
        <p>{t("Please login to continue")}</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="role">{t("Select Role")}</label>
            <select id="role" value={role} onChange={e => setRole(e.target.value)} className="role-select">
              <option value="farmer">{t("Farmer")}</option>
              <option value="government">{t("Government")}</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="username">{t("Username")}</label>
            <input type="text" id="username" placeholder="Enter username" required />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">{t("Password")}</label>
            <input type="password" id="password" placeholder="Enter password" required />
          </div>

          <button type="submit" className="login-btn">{t("Login")}</button>
        </form>
      </div>
    </div>;
};
export default Login;