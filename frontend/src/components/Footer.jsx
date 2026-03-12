import { NavLink } from "react-router-dom";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-row">
        <div className="footer-copy">
          <p>© {new Date().getFullYear()} Standard Engineering and Builders.</p>
          <p>Construction materials, structural works, finishing, and building projects</p>
        </div>

        <div className="footer-admin">
          <NavLink to="/admin" className="admin-link">
            Admin
          </NavLink>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
