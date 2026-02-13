import { useState } from 'react';
import './PageStyles.css';

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const onSubmit = (event) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSubmitted(true);
  };

  return (
    <section className="section">
      <div className="container narrow">
        <div className="page-heading">
          <h1>Contact AERA</h1>
          <p>Reach our team for assistance, partnerships, or media requests.</p>
        </div>

        <form className="surface-card form-card" onSubmit={onSubmit}>
          <label htmlFor="contactName">
            Name
            <input
              id="contactName"
              className="field"
              value={form.name}
              onChange={(event) => updateForm({ name: event.target.value })}
            />
          </label>

          <label htmlFor="contactEmail">
            Email
            <input
              id="contactEmail"
              className="field"
              type="email"
              value={form.email}
              onChange={(event) => updateForm({ email: event.target.value })}
            />
          </label>

          <label htmlFor="contactMessage">
            Message
            <textarea
              id="contactMessage"
              rows={5}
              value={form.message}
              onChange={(event) => updateForm({ message: event.target.value })}
            />
          </label>

          <button type="submit" className="primary-btn">
            Submit
          </button>

          {submitted ? <p className="success-text">Message sent (demo). We will respond shortly.</p> : null}
        </form>

        <div className="surface-card social-card">
          <h3>Social</h3>
          <div className="social-links">
            <a href="#" onClick={(event) => event.preventDefault()}>
              Instagram
            </a>
            <a href="#" onClick={(event) => event.preventDefault()}>
              X / Twitter
            </a>
            <a href="#" onClick={(event) => event.preventDefault()}>
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactPage;
