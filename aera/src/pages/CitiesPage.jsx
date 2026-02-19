import { Link } from 'react-router-dom';
import { mainCities } from '../data/mainCities';
import './PageStyles.css';

const CitiesPage = () => (
  <section className="section">
    <div className="container">
      <div className="cities-hero surface-card">
        <p className="hero-kicker">AERA Network</p>
        <h1>Our Global Hubs</h1>
        <p>
          AERA's key gateways are built for premium travel and reliable global connectivity. Explore
          the cities where our network is strongest.
        </p>
      </div>

      <div className="grid cities-overview-grid">
        {mainCities.map((city) => (
          <article className="surface-card city-overview-card" key={city.slug}>
            <img src={city.heroImage} alt={`${city.name} skyline`} />
            <div>
              <h3>{city.name}</h3>
              <p className="city-airport-code">{city.airportCode}</p>
              <p>{city.tagline}</p>
              <Link to={`/cities/${city.slug}`} className="primary-btn">
                Explore City
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default CitiesPage;
