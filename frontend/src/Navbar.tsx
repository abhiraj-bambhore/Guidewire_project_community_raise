import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
          <span className="navbar-brand-dot" />
          Protected Community Raise
        </NavLink>
        <div className="navbar-links">
          <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>
            Campaigns
          </NavLink>
          <NavLink to="/invest" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            My Investments
          </NavLink>
          <NavLink to="/merchant" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Merchant
          </NavLink>
          <NavLink to="/audit" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Audit
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
