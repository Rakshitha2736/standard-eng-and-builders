import BackButton from "../components/BackButton";

function ContactPage() {
  return (
    <section className="container page-section">
      <BackButton fallbackTo="/" />
      <header className="page-header">
        <p className="eyebrow">Contact</p>
        <h1>Get in Touch</h1>
      </header>

      <div className="contact-card">
        <p>
          <strong>Standard Engineering and Builders</strong>
        </p>
        <p>NO.1/1, PULIYAMARA THOTTAM 2nd STREET, MANGALAM ROAD, TIRUPPUR 641604</p>
        <p>CELL: 98422 50631, 86106 01760</p>
      </div>
    </section>
  );
}

export default ContactPage;
