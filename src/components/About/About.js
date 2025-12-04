import { useState, useEffect } from 'react';
import './About.css';

const About = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    '/hero-images/hero1.jpg',
    '/hero-images/hero2.jpg',
    '/hero-images/hero3.jpg',
    '/hero-images/hero4.jpg'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="about-page">
      {/* Hero Section with Sliding Background */}
      <section className="about-hero-section">
        {/* Sliding Background Images */}
        <div className="hero-slideshow">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide})` }}
            />
          ))}
        </div>

        <div className="hero-overlay"></div>
        <div className="container">
          <h1 className="hero-main-title">NAMIBIAN BUSINESS REGISTRATION</h1>

          {/* Three Main Feature Cards */}
          <div className="hero-features-grid">
            <div className="hero-feature-card">
              <div className="hero-feature-icon">📝</div>
              <h3>Register your business in Namibia easily and quickly</h3>
              <p>Lorem your business cited enterprises, small and medium-sizes SMEs, and or investors for localize don</p>
            </div>

            <div className="hero-feature-card">
              <div className="hero-feature-icon">📋</div>
              <h3>Access a wide range of business services</h3>
              <p>Lorem your business i and est namibia omalt in psal medium-sizes Similar est businesses feuspend et of recol supports for local businesses</p>
            </div>

            <div className="hero-feature-card">
              <div className="hero-feature-icon">⚙️</div>
              <h3>Get support from our team of experts</h3>
              <p>Lorem your business client, tempus maleque vitae interdum. Intergers</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container">

        {/* Vision Section */}
        <section className="vision-mission-section vision-section">
          <h2 className="large-title">Our Vision</h2>
          <p className="centered-text">
            To inspire and innovate, creating solutions that empower communities and drive sustainable growth
            through SME formalization and JESMIKE investment facilitation across Namibia.
          </p>
        </section>

        {/* Mission Section */}
        <section className="vision-mission-section mission-section">
          <h2 className="large-title">Our Mission</h2>
          <p className="centered-text">
            Our mission is to deliver excellence through dedication, integrity, and collaboration,
            fostering a positive impact on the world around us by formalizing the informal economy
            and connecting Namibian businesses with global investment opportunities.
          </p>
        </section>

        {/* Objectives Section */}
        <section className="about-section">
          <h2 className="section-title">Our Objectives</h2>
          <div className="objectives-grid">
            <div className="objective-card">
              <img src="/hero-images/registration.jpeg" alt="Registration" className="objective-image-icon" />
              <h3>Encourage Business Registration</h3>
              <p>
                Motivate unregistered businesses operating for 3+ years to formalize their
                operations and gain official recognition from NIPDB and government ministries.
              </p>
            </div>
            <div className="objective-card">
              <img src="/hero-images/statistics.png" alt="Statistics" className="objective-image-icon" />
              <h3>Provide Real-Time Statistics</h3>
              <p>
                Deliver comprehensive analytics and insights on the SME landscape in Namibia,
                enabling data-driven decision making for government agencies and stakeholders.
              </p>
            </div>
            <div className="objective-card">
              <div className="objective-icon">💼</div>
              <h3>MTC</h3>
              <p>
                Create a matchmaking platform connecting Namibian SMEs with JESMIKE investors,
                promoting foreign direct investment and economic development.
              </p>
            </div>
            <div className="objective-card">
              <img src="/hero-images/training.jpeg" alt="Training" className="objective-image-icon" />
              <h3>Support Training & Development</h3>
              <p>
                Provide short course training and follow-up support for registered SMEs to
                enhance their capabilities and growth potential.
              </p>
            </div>
            <div className="objective-card">
              <img src="/hero-images/regional.jpeg" alt="Regional Coverage" className="objective-image-icon" />
              <h3>Regional Coverage</h3>
              <p>
                Ensure comprehensive coverage across all 14 regions of Namibia, promoting
                inclusive economic development throughout the country.
              </p>
            </div>
            <div className="objective-card">
              <div className="objective-icon">🤝</div>
              <h3>Government Collaboration</h3>
              <p>
                Work closely with government ministries, NIPDB, BIPA, and embassies to
                streamline the registration and investment process.
              </p>
            </div>
          </div>
        </section>

        {/* Stakeholders Section */}
        <section className="about-section alt">
          <h2 className="section-title">Our Stakeholders</h2>
          <div className="stakeholders-grid">
            <div className="stakeholder-card sme-owners-card">
              <img src="/hero-images/namibiaYouthCouncil.jpeg" alt="SME Owners" className="stakeholder-logo" />
              <h3>NYCN</h3>
              <p>National Youth council of Namibia</p>
            </div>
            <div className="stakeholder-card gov-ministries-card">
              <img src="/hero-images/namibia.jpeg" alt="Government of Namibia" className="stakeholder-logo" />
              <h3>Government Ministries</h3>
              <p>Ministry of Labour, Industry, Finance, Agriculture, Youth, and NIPDB</p>
            </div>
            <div className="stakeholder-card jesmike-card">
              <img src="/hero-images/mtc.jpeg" alt="JESMIKE Investors" className="stakeholder-logo" />
              <h3>MTC</h3>
              <p>One the supportive organisation to youthe development</p>
            </div>
            <div className="stakeholder-card bipa-card">
              <img src="/hero-images/bipa.jpeg" alt="BIPA Logo" className="stakeholder-logo" />
              <h3>BIPA</h3>
              <p>Business and Intellectual Property Authority of Namibia</p>
            </div>
            <div className="stakeholder-card">
              <img src="/hero-images/telecom.jpeg" alt="telecom Logo" className="stakeholder-logo" />
              <h3>Telecom Namibia</h3>
              <p>One of the committed organisation to talent and youth development</p>
            </div>
            <div className="stakeholder-card nipdb-card">
              <img src="/hero-images/nipdb.png" alt="NIPDB Logo" className="stakeholder-logo" />
              <h3>NIPDB</h3>
              <p>Namibia Investment Promotion and Development Board</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;

