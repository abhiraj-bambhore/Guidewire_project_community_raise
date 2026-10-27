import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <>
      <div className="top-royal-stripe" />
      <nav className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="navbar-brand">
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="5" fill="#0055b8" />
              <path d="M8 8h12v3H11v6h9v-4h-4v-3h7v10H8V8z" fill="#ffffff" />
            </svg>
            <span className="guidewire-brand-title">GUIDEWIRE</span>
            <span className="guidewire-brand-sub">Community Raise</span>
          </NavLink>

          <div className="navbar-links">
            <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>
              Campaigns
            </NavLink>
            <NavLink to="/drafting" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Drafting Layer <span style={{ fontSize: '10px', background: '#dbeafe', color: '#0055b8', padding: '1px 5px', borderRadius: '4px', fontWeight: 700, marginLeft: '3px' }}>MiroFish</span>
            </NavLink>
            <NavLink to="/invest" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              My Investments
            </NavLink>
            <NavLink to="/merchant" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Merchant Hub
            </NavLink>
            <NavLink to="/audit" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Safety Audit
            </NavLink>
            <NavLink to="/merchant" className="btn-royal-nav">
              + Launch Campaign
            </NavLink>
          </div>
        </div>
      </nav>
    </>
  )
}
