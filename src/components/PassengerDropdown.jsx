import { useEffect, useRef, useState } from 'react';
import { passengerSummary } from '../lib/flightEngine';
import './PassengerDropdown.css';

const labels = {
  adults: 'Adults (18+)',
  teens: 'Teens (13-17)',
  children: 'Children (2-12)',
  infants: 'Infants (<2)',
};

const PassengerDropdown = ({ passengers, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const totalPassengers = Object.values(passengers).reduce((acc, count) => acc + count, 0);

  const updateCount = (key, delta) => {
    const next = { ...passengers };
    const current = next[key];

    if (delta > 0 && totalPassengers >= 9) {
      return;
    }

    if (delta < 0) {
      if (key === 'adults' && current <= 1) return;
      if (key !== 'adults' && current <= 0) return;
      next[key] = current - 1;
      if (key === 'adults' && next.infants > next.adults) {
        next.infants = next.adults;
      }
      onChange(next);
      return;
    }

    if (key === 'infants' && next.infants >= next.adults) {
      return;
    }

    next[key] = current + 1;
    onChange(next);
  };

  return (
    <div className="pax-wrap" ref={rootRef}>
      <label htmlFor="passengers">Passengers</label>
      <button
        id="passengers"
        type="button"
        className="pax-trigger"
        onClick={() => setIsOpen((state) => !state)}
      >
        {passengerSummary(passengers)}
      </button>

      {isOpen ? (
        <div className="pax-panel">
          {Object.entries(labels).map(([key, label]) => (
            <div className="pax-row" key={key}>
              <span>{label}</span>
              <div className="pax-controls">
                <button type="button" onClick={() => updateCount(key, -1)} aria-label={`Decrease ${key}`}>
                  -
                </button>
                <strong>{passengers[key]}</strong>
                <button type="button" onClick={() => updateCount(key, 1)} aria-label={`Increase ${key}`}>
                  +
                </button>
              </div>
            </div>
          ))}

          <p className="pax-rule">Maximum 9 passengers. Infants cannot exceed adults.</p>
        </div>
      ) : null}
    </div>
  );
};

export default PassengerDropdown;
