import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const heroSlides = [
  {
    title: "Construction Materials Supply",
    image:
      "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=1400&q=80"
  },
  {
    title: "Structural Work Execution",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=80"
  },
  {
    title: "Finishing Work Quality",
    image:
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1400&q=80"
  },
  {
    title: "Building Services Integration",
    image:
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1400&q=80"
  },
  {
    title: "Commercial and Industrial Projects",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80"
  }
];

const categoryHighlights = [
  {
    title: "Construction Materials",
    summary: "Cement, TMT steel rods, and bricks for reliable, long-lasting construction."
  },
  {
    title: "Structural Works",
    summary: "RCC slab construction, PCC work, and brick masonry executed with quality standards."
  },
  {
    title: "Fabrication Works",
    summary: "Gates, steel structures, windows and grills, staircases, railings, and steel doors."
  },
  {
    title: "Finishing Works",
    summary: "Tile laying, painting, and doors and windows installation for clean final delivery."
  },
  {
    title: "Building Services",
    summary: "Electrical work and parapet wall construction completed with safety-focused methods."
  },
  {
    title: "Construction Projects",
    summary: "Commercial and industrial building projects planned and delivered end to end."
  }
];

function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div>
      <section className="hero-section">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-copy">
            <p className="eyebrow">Standard Engineering and Builders</p>
            <h1>Construction Products and Services Portfolio</h1>
            <p>
              Standard Engineering and Builders delivers trusted construction
              materials, structural works, finishing services, and complete
              building project solutions for commercial and industrial clients.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary">
                Explore Products
              </Link>
              <Link to="/enquiry" className="btn btn-outline">
                Send Enquiry
              </Link>
            </div>
            </div>

            <div className="hero-slider" aria-label="Construction services image slider">
              {heroSlides.map((slide, index) => (
                <img
                  key={slide.title}
                  src={slide.image}
                  alt={slide.title}
                  className={`hero-slide ${index === activeSlide ? "active" : ""}`}
                />
              ))}

              <div className="hero-slider-caption">
                <strong>{heroSlides[activeSlide].title}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-categories-section">
        <div className="container">
          <header className="home-categories-head">
            <p className="eyebrow">What We Offer</p>
            <h2>Core Construction Categories</h2>
            <p>
              Explore our key construction service categories for residential,
              commercial, and industrial requirements.
            </p>
          </header>

          <div className="home-categories-grid">
            {categoryHighlights.map((item) => (
              <Link
                key={item.title}
                to={`/products?category=${encodeURIComponent(item.title)}`}
                className="home-category-link"
              >
                <article className="home-category-card">
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

export default HomePage;
