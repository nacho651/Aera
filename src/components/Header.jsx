import { NavLink } from 'react-router-dom';
import './Header.css';

const navItems = [
  { to: '/book', label: 'Book' },
  { to: '/manage', label: 'Manage' },
  { to: '/experience', label: 'Experience' },
  { to: '/fleet', label: 'Fleet' },
  { to: '/cities', label: 'Cities' },
  { to: '/mission', label: 'Mission' },
  { to: '/about', label: 'About' },
];

const Header = () => (
  <header className="site-header">
    <div className="container header-inner">
      <NavLink to="/" className="brand" aria-label="AERA Home">
        <span className="brand-mark" aria-hidden="true">
          <img src="/images/aera-logo.png" alt="" className="brand-mark-image" />
        </span>
        <span className="brand-name">AERA</span>
      </NavLink>

      <nav className="main-nav" aria-label="Primary Navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="header-actions">
        <NavLink
          to="/destinations"
          className={({ isActive }) => `mini-link${isActive ? ' active' : ''}`}
        >
          Destinations
        </NavLink>
        <NavLink to="/contact" className={({ isActive }) => `mini-link${isActive ? ' active' : ''}`}>
          Contact
        </NavLink>
      </div>
    </div>
  </header>
);

export default Header;
