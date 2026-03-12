import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="top-nav">
      <div className="container nav-layout">
        <NavLink to="/" className="brand-mark">
          <span className="brand-highlight">STANDARD</span> ENGINEERING AND BUILDERS
        </NavLink>

        <nav className="nav-links" aria-label="Primary">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/enquiry">Enquiry</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
