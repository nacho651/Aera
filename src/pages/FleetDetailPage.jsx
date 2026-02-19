import { Link, Navigate, useParams } from 'react-router-dom';
import { fleetMap } from '../data/fleet';
import { haversineKm } from '../lib/flightEngine';
import { metroMap } from '../data/metros';
import './PageStyles.css';

const routeCandidates = [
  ['MVD', 'BUE'],
  ['BUE', 'SCL'],
  ['MIA', 'NYC'],
  ['LON', 'PAR'],
  ['BUE', 'MIA'],
  ['LIM', 'MEX'],
  ['NYC', 'LON'],
  ['BUE', 'MAD'],
  ['SAO', 'MIA'],
  ['PAR', 'DXB'],
  ['DXB', 'SIN'],
  ['LON', 'SIN'],
  ['PAR', 'TYO'],
  ['NYC', 'SYD'],
  ['LAX', 'DOH'],
  ['SYD', 'DXB'],
];

const formatRouteLine = (fromCode, toCode) => {
  const from = metroMap[fromCode];
  const to = metroMap[toCode];
  return `${from.city} (${from.airport}) → ${to.city} (${to.airport})`;
};

const generateTypicalRoutes = (aircraft) => {
  const maxRange = aircraft.range_km;

  const filtered = routeCandidates
    .map(([fromCode, toCode]) => {
      const from = metroMap[fromCode];
      const to = metroMap[toCode];
      const distanceKm = Math.round(haversineKm(from, to));
      return { fromCode, toCode, distanceKm };
    })
    .filter((route) => route.distanceKm <= maxRange * 0.94)
    .filter((route) => {
      if (aircraft.slug === 'a320neo') return route.distanceKm < 3000;
      if (aircraft.slug === 'a321xlr') return route.distanceKm >= 2500 && route.distanceKm <= 7000;
      if (aircraft.slug === 'b787') return route.distanceKm >= 5000 && route.distanceKm <= 12000;
      if (aircraft.slug === 'a350xwb') return route.distanceKm >= 8000;
      if (aircraft.slug === 'b777x') return route.distanceKm >= 10000;
      return true;
    })
    .slice(0, 5);

  return filtered;
};

const FleetDetailPage = () => {
  const { aircraftSlug } = useParams();
  const aircraft = fleetMap[aircraftSlug];

  if (!aircraft) {
    return <Navigate to="/fleet" replace />;
  }

  const typicalRoutes = generateTypicalRoutes(aircraft);

  return (
    <section className="section">
      <div className="container">
        <div className="fleet-detail-hero surface-card">
          <img src={aircraft.image} alt={aircraft.name} />
          <div>
            <p className="hero-kicker">Fleet profile</p>
            <h1>{aircraft.name}</h1>
            <p>{aircraft.marketingTitle}</p>
            <div className="fleet-detail-actions">
              <Link className="primary-btn" to={`/book?aircraft=${aircraft.slug}`}>
                Book this aircraft
              </Link>
              <Link className="secondary-btn" to="/fleet">
                Back to fleet
              </Link>
            </div>
          </div>
        </div>

        <div className="grid fleet-detail-grid">
          <article className="surface-card detail-panel">
            <h3>Key Specs</h3>
            <table className="spec-table">
              <tbody>
                <tr>
                  <th>Range</th>
                  <td>~{aircraft.range_km.toLocaleString()} km</td>
                </tr>
                <tr>
                  <th>Typical seats</th>
                  <td>~{aircraft.seats}</td>
                </tr>
                <tr>
                  <th>Role</th>
                  <td>{aircraft.role}</td>
                </tr>
                {Object.entries(aircraft.specs).map(([key, value]) => (
                  <tr key={key}>
                    <th>{key}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="surface-card detail-panel">
            <h3>Cabin Experience</h3>
            <ul className="detail-list">
              {aircraft.cabinExperience.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3>Highlights</h3>
            <ul className="detail-list">
              {aircraft.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>

        <article className="surface-card routes-panel">
          <h3>Routes Typically Flown</h3>
          <div className="grid route-grid">
            {typicalRoutes.map((route) => (
              <div key={`${route.fromCode}-${route.toCode}`} className="route-chip">
                <p>{formatRouteLine(route.fromCode, route.toCode)}</p>
                <span>{route.distanceKm.toLocaleString()} km</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
};

export default FleetDetailPage;
