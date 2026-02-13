import { Link, Navigate, useParams } from 'react-router-dom';
import { destinationGroups } from '../data/destinations';
import { fleetMap } from '../data/fleet';
import { metroMap } from '../data/metros';
import { haversineKm } from '../lib/flightEngine';
import { estimateRouteDemand, recommendAircraftForRoute } from '../lib/demandEstimator';
import { mainCityBySlug } from '../data/mainCities';
import './PageStyles.css';

const uniqueDestinationCodes = Array.from(
  new Set(destinationGroups.flatMap((group) => group.metros)),
);

const formatDuration = (distanceKm) => {
  const baseMinutes = Math.round((distanceKm / 840) * 60 + (distanceKm > 5000 ? 45 : 25));
  const hours = Math.floor(baseMinutes / 60);
  const minutes = baseMinutes % 60;
  return `${hours}h ${minutes}m`;
};

const countByHubType = {
  'Primary hub': 6,
  'Major hub': 6,
  'Secondary gateway': 5,
  Gateway: 4,
};

const destinationsByHubType = {
  'Primary hub': 76,
  'Major hub': 69,
  'Secondary gateway': 52,
  Gateway: 44,
};

const pickAircraft = ({ city, fromCode, toCode, distanceKm }) => {
  const demandProfile = estimateRouteDemand({ fromCode, toCode, distanceKm });

  const aircraftSlug = recommendAircraftForRoute({
    distanceKm,
    demandProfile,
    allowedAircraftSlugs: city.aircraftTypesCommonlyUsed,
  });

  return fleetMap[aircraftSlug] || fleetMap[city.aircraftTypesCommonlyUsed[0]];
};

const generateRoutes = (city) => {
  const fromMetro = metroMap[city.metroCode];
  const featuredSet = new Set(city.featuredRoutes);

  const routes = uniqueDestinationCodes
    .filter((code) => code !== city.metroCode)
    .map((code) => {
      const destination = metroMap[code];
      const distanceKm = Math.round(haversineKm(fromMetro, destination));
      const demandProfile = estimateRouteDemand({
        fromCode: city.metroCode,
        toCode: code,
        distanceKm,
      });

      const aircraft = pickAircraft({
        city,
        fromCode: city.metroCode,
        toCode: code,
        distanceKm,
      });

      let score = 0;
      if (featuredSet.has(code)) score += 110;
      if (destination.region !== city.region) score += 18;
      if (demandProfile.tier === 'high' || demandProfile.tier === 'very-high') score += 14;
      score -= distanceKm / 2800;

      return {
        destinationCode: code,
        destinationName: destination.city,
        destinationAirport: destination.airport,
        distanceKm,
        duration: formatDuration(distanceKm),
        aircraft,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, countByHubType[city.hubType] || 4);

  return routes;
};

const CityDetailPage = () => {
  const { citySlug } = useParams();
  const city = citySlug ? mainCityBySlug[citySlug] : null;

  if (!city) {
    return <Navigate to="/cities" replace />;
  }

  const routes = generateRoutes(city);
  const descriptionParagraphs = city.description.split('\n\n');

  const aircraftCards = city.aircraftTypesCommonlyUsed
    .map((slug) => fleetMap[slug])
    .filter(Boolean);

  return (
    <section className="section">
      <div className="container">
        <div className="city-hero surface-card">
          <img src={city.heroImage} alt={city.name} />
          <div>
            <p className="hero-kicker">City Gateway</p>
            <h1>{city.name}</h1>
            <p className="city-code-line">
              {city.name} - {city.airportCode}
            </p>
            <p>{city.positioningLine}</p>
          </div>
        </div>

        <article className="surface-card city-about-panel">
          <h2>About the City</h2>
          {descriptionParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </article>

        <div className="city-info-grid">
          <article className="surface-card city-info-panel">
            <h3>Airport & Hub Info</h3>
            <p>
              <strong>{city.airportName}</strong> ({city.airportCode})
            </p>
            <p>{city.airportDescription}</p>
            <p>
              <strong>Network role:</strong> {city.hubType}
            </p>
            <p>
              <strong>Destinations served:</strong> ~{destinationsByHubType[city.hubType]} direct and connecting
              markets
            </p>
            <p>
              <strong>Lounge availability:</strong> Premium lounge available at {city.airportCode}
            </p>
            <p>
              <strong>Terminal:</strong> {city.terminalInfo}
            </p>
          </article>

          <article className="surface-card city-info-panel">
            <h3>Key Facts</h3>
            <ul className="detail-list">
              {city.keyFacts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </article>
        </div>

        <article className="surface-card city-routes-panel">
          <div className="section-heading compact-heading">
            <div>
              <h2>Routes from This City</h2>
              <p className="section-subtitle">Dynamic route examples based on network reach and aircraft range.</p>
            </div>
          </div>
          <div className="grid city-routes-grid">
            {routes.map((route) => (
              <div className="route-chip route-card" key={route.destinationCode}>
                <h4>
                  {city.name} ({city.airportCode}) -> {route.destinationName} ({route.destinationAirport})
                </h4>
                <p>
                  Typical aircraft: <strong>{route.aircraft.name}</strong>
                </p>
                <p>Approximate duration: {route.duration}</p>
                <Link
                  to={`/book?from=${city.metroCode}&to=${route.destinationCode}&aircraft=${route.aircraft.slug}`}
                  className="secondary-btn"
                >
                  Book route
                </Link>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card city-aircraft-panel">
          <h2>Aircraft Commonly Deployed</h2>
          <div className="grid city-aircraft-grid">
            {aircraftCards.map((aircraft) => (
              <div className="surface-card city-aircraft-card" key={aircraft.slug}>
                <img src={aircraft.image} alt={aircraft.name} />
                <div>
                  <h4>{aircraft.name}</h4>
                  <p>Range: ~{aircraft.range_km.toLocaleString()} km</p>
                  <p>{aircraft.role}</p>
                  <Link to={`/fleet/${aircraft.slug}`} className="mini-cta">
                    View aircraft page
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card city-experience-panel">
          <h2>Experience in This City</h2>
          <div className="grid three-up-grid">
            <div className="about-card surface-card">
              <h3>Lounge Access</h3>
              <p>{city.loungeInfo}</p>
            </div>
            <div className="about-card surface-card">
              <h3>Premium Check-in</h3>
              <p>Dedicated premium check-in counters and priority baggage tags for faster terminal flow.</p>
            </div>
            <div className="about-card surface-card">
              <h3>Fast Track & Amenities</h3>
              <p>Fast-track security lanes, concierge support, and curated Business/First pre-flight services.</p>
            </div>
          </div>
        </article>

        <article className="surface-card city-cta-panel">
          <h2>Plan Your Next Departure</h2>
          <p>{city.name} connects to AERA's global network with premium service from curb to cabin.</p>
          <div className="hero-actions">
            <Link to={`/book?from=${city.metroCode}`} className="primary-btn">
              Book from {city.name}
            </Link>
            <Link to="/fleet" className="secondary-btn">
              Explore Fleet
            </Link>
            <Link to="/destinations" className="secondary-btn">
              View Destinations
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
};

export default CityDetailPage;
