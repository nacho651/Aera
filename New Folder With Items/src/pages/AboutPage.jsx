import './PageStyles.css';

const values = [
  {
    title: 'Clarity',
    body: 'Transparent fares, simple policies, and direct communication at every stage of travel.',
  },
  {
    title: 'Craft',
    body: 'Careful attention to cabin materials, digital touchpoints, and service details.',
  },
  {
    title: 'Reliability',
    body: 'Operational consistency and proactive planning across the network.',
  },
];

const leadership = [
  { name: 'Ignacio de los santos', role: 'Chief Executive Officer' },
  { name: 'Tomas Ivers', role: 'Chief Operations Officer' },
  { name: 'Nadia Rahal', role: 'Chief Customer Officer' },
];

const press = [
  {
    title: 'AERA Announces Expanded Europe-Americas Corridor',
    date: 'January 10, 2026',
  },
  {
    title: 'AERA Introduces New Connected Cabin Platform',
    date: 'November 22, 2025',
  },
  {
    title: 'AERA Fleet Renewal Program Reaches 70% Completion',
    date: 'September 2, 2025',
  },
];

const AboutPage = () => (
  <section className="section">
    <div className="container">
      <div className="page-heading">
        <h1>About AERA</h1>
        <p>
          AERA began with a simple thesis: global aviation can be premium, efficient, and more coherent
          for modern travelers. Today we connect key business and leisure markets through a growing
          next-generation fleet.
        </p>
      </div>

      <div className="grid three-up-grid">
        {values.map((item) => (
          <article className="surface-card about-card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>

      <div className="section-heading minor-space">
        <div>
          <h2>Leadership</h2>
        </div>
      </div>

      <div className="grid three-up-grid">
        {leadership.map((person) => (
          <article key={person.name} className="surface-card person-card">
            <div className="person-avatar" aria-hidden="true" />
            <h3>{person.name}</h3>
            <p>{person.role}</p>
          </article>
        ))}
      </div>

      <div className="section-heading minor-space">
        <div>
          <h2>Press</h2>
        </div>
      </div>

      <div className="grid three-up-grid">
        {press.map((item) => (
          <article key={item.title} className="surface-card press-card">
            <h3>{item.title}</h3>
            <p>{item.date}</p>
            <button type="button" className="secondary-btn">
              Read release
            </button>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default AboutPage;
