import { Link } from 'react-router-dom';
import { fleet } from '../data/fleet';
import { siteImagePaths } from '../data/imageAssets';
import { metroMap } from '../data/metros';
import { mainCities } from '../data/mainCities';
import './PageStyles.css';

const featuredCodes = ['PAR', 'NYC', 'DXB', 'SIN'];

const whyAera = [
  {
    title: 'Designed Around Time',
    body: 'Fast boarding, reliable turns, and smart schedules built for global business and leisure travel.',
  },
  {
    title: 'Right Aircraft, Right Route',
    body: 'A modern mixed fleet that pairs comfort and efficiency for every stage length.',
  },
  {
    title: 'Premium by Default',
    body: 'Consistent cabin design, connected service, and attentive crews across the network.',
  },
  {
    title: 'Data-Driven Operations',
    body: 'Predictive maintenance and intelligent routing to keep flights on-time and sustainable.',
  },
];

const featuredHubs = ['london', 'buenos-aires', 'singapore'];

const HomePage = () => (
  <>
    <section className="home-hero section">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="hero-kicker">AERA Global Network</p>
          <h1>THE FUTURE OF FLIGHT</h1>
          <p>
            Discover premium travel shaped by modern aircraft, refined onboard service, and a network
            designed for global connectivity.
          </p>
          <div className="hero-actions">
            <Link to="/book" className="primary-btn">
              Book now
            </Link>
            <Link to="/fleet" className="secondary-btn">
              Explore fleet
            </Link>
            <Link to="/mission" className="secondary-btn">
              Our mission
            </Link>
          </div>
        </div>

        <div className="hero-image-wrap surface-card">
          <img src={siteImagePaths.heroFlight} alt="AERA aircraft in flight" />
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <h2>Featured Destinations</h2>
            <p className="section-subtitle">From Atlantic gateways to Asia-Pacific innovation hubs.</p>
          </div>
          <Link to="/destinations" className="secondary-btn">
            View all
          </Link>
        </div>

        <div className="grid destination-feature-grid">
          {featuredCodes.map((code) => {
            const metro = metroMap[code];
            return (
              <article className="surface-card destination-feature" key={code}>
                <h3>
                  {metro.city} ({metro.code})
                </h3>
                <p>
                  Primary airport: <strong>{metro.airport}</strong>
                </p>
                <span>{metro.region}</span>
              </article>
            );
          })}
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <h2>Cities</h2>
            <p className="section-subtitle">Discover AERA's main gateways and hub experiences.</p>
          </div>
          <Link to="/cities" className="secondary-btn">
            Explore all cities
          </Link>
        </div>

        <div className="grid home-cities-grid">
          {featuredHubs.map((slug) => {
            const city = mainCities.find((entry) => entry.slug === slug);
            if (!city) return null;

            return (
              <article className="surface-card home-city-card" key={city.slug}>
                <img src={city.heroImage} alt={city.name} />
                <div>
                  <h3>{city.name}</h3>
                  <p>
                    {city.airportCode} | {city.hubType}
                  </p>
                  <p>{city.tagline}</p>
                  <Link to={`/cities/${city.slug}`} className="mini-cta">
                    Explore city
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <h2>Fleet Teaser</h2>
            <p className="section-subtitle">
              Built for range, efficiency, and comfort across short-haul and intercontinental missions.
            </p>
          </div>
        </div>

        <div className="grid home-fleet-grid">
          {fleet.map((aircraft) => (
            <article key={aircraft.slug} className="surface-card fleet-mini-card">
              <img src={aircraft.image} alt={aircraft.name} />
              <div>
                <h3>{aircraft.name}</h3>
                <p>{aircraft.marketingTitle}</p>
                <Link to={`/fleet/${aircraft.slug}`} className="mini-cta">
                  View aircraft
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <h2>Why AERA</h2>
            <p className="section-subtitle">A modern airline proposition built for consistency.</p>
          </div>
        </div>

        <div className="grid why-grid">
          {whyAera.map((item) => (
            <article className="surface-card why-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default HomePage;
