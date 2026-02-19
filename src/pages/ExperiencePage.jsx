import './PageStyles.css';

const cabins = [
  {
    name: 'Economy',
    text: 'Ergonomic seats, high-speed connectivity, and signature hospitality from takeoff to landing.',
  },
  {
    name: 'Premium Economy',
    text: 'Wider seats, extended recline, upgraded dining, and quieter dedicated sections.',
  },
  {
    name: 'Business',
    text: 'Direct aisle access, lie-flat suites on long-haul, and chef-led service timing.',
  },
  {
    name: 'First',
    text: 'Private suites, curated onboard menus, and personalized concierge support.',
  },
];

const extras = [
  {
    title: 'Onboard Wi-Fi',
    body: 'Gate-to-gate streaming-grade Wi-Fi packages with tiered data options for every traveler.',
  },
  {
    title: 'Dining',
    body: 'Regional menus and premium cabin pairings built with partner chefs and nutrition teams.',
  },
  {
    title: 'Lounge Access',
    body: 'Quiet lounges in major hubs with productivity zones, shower suites, and fast-track support.',
  },
];

const ExperiencePage = () => (
  <>
    <section className="section experience-hero">
      <div className="container page-heading">
        <h1>Experience AERA</h1>
        <p>
          Every touchpoint, from mobile check-in to arrival, is designed around calm, modern travel.
        </p>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <h2>Cabins</h2>
            <p className="section-subtitle">A cohesive cabin language across the full network.</p>
          </div>
        </div>

        <div className="grid four-up-grid">
          {cabins.map((cabin) => (
            <article key={cabin.name} className="surface-card icon-card">
              <div className="icon-dot" aria-hidden="true" />
              <h3>{cabin.name}</h3>
              <p>{cabin.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <h2>Onboard & Ground</h2>
            <p className="section-subtitle">Connected service for every stage of your trip.</p>
          </div>
        </div>

        <div className="grid three-up-grid">
          {extras.map((item) => (
            <article key={item.title} className="surface-card experience-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default ExperiencePage;
