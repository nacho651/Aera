import { Link } from 'react-router-dom';
import { fleet } from '../data/fleet';
import './PageStyles.css';

const FleetPage = () => (
  <section className="section">
    <div className="container">
      <div className="page-heading">
        <h1>Fleet Overview</h1>
        <p>
          AERA operates a right-sized, next-generation fleet spanning short-haul efficiency and
          ultra-long-range flagship service.
        </p>
      </div>

      <div className="grid fleet-grid">
        {fleet.map((aircraft) => (
          <article className="surface-card fleet-card" key={aircraft.slug}>
            <img src={aircraft.image} alt={aircraft.name} />
            <div>
              <h3>{aircraft.name}</h3>
              <p>{aircraft.role}</p>
              <Link className="primary-btn" to={`/fleet/${aircraft.slug}`}>
                View more
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default FleetPage;
