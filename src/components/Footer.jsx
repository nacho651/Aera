import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => (
  <footer className="site-footer">
    <div className="container footer-inner">
      <p>(c) {new Date().getFullYear()} AERA Airlines. All rights reserved.</p>
      <div className="footer-links">
        <Link to="/destinations">Destinations</Link>
        <Link to="/contact">Contact</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
