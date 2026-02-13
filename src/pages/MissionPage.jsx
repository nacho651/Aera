import './PageStyles.css';

const pillars = [
  {
    title: 'Sustainability with Accountability',
    body: 'AERA invests in fleet renewal, smarter descent planning, and SAF partnerships where infrastructure exists. We publish measurable targets and track operational emissions per available seat kilometer.',
  },
  {
    title: 'Customer Experience as Core Product',
    body: 'From booking clarity to onboard consistency, our product strategy prioritizes traveler confidence. Clear policies, reliable updates, and service recovery are treated as operational standards.',
  },
  {
    title: 'Operational Excellence',
    body: 'Network planning, maintenance analytics, and crew readiness are connected through one performance model. Our objective is simple: safe, punctual, and predictable operations.',
  },
  {
    title: 'Premium, Modern, Global',
    body: 'AERA is positioned as a design-led airline with global ambition. We bridge major hubs and emerging demand corridors with right-sized aircraft and intentional service.',
  },
];

const MissionPage = () => (
  <>
    <section className="section mission-hero">
      <div className="container page-heading">
        <h1>Our Mission</h1>
        <p>
          Build the world's most trusted modern airline by combining efficient operations, premium
          service, and practical progress toward lower-impact aviation.
        </p>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <div className="grid mission-grid">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="surface-card mission-card">
              <h3>{pillar.title}</h3>
              <p>{pillar.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default MissionPage;
