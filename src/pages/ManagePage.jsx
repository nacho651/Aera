import { useState } from 'react';
import { metroMap } from '../data/metros';
import { buildItinerary } from '../lib/flightEngine';
import './PageStyles.css';

const samplePairs = [
  ['MVD', 'PAR'],
  ['NYC', 'LON'],
  ['SAO', 'MIA'],
  ['BUE', 'MAD'],
  ['DXB', 'SIN'],
  ['LIM', 'MEX'],
  ['SYD', 'SIN'],
];

const hash = (value) => {
  let out = 0;
  for (let i = 0; i < value.length; i += 1) {
    out = (out * 33 + value.charCodeAt(i)) & 0x7fffffff;
  }
  return out;
};

const formatRoute = (codes) =>
  codes
    .map((code) => {
      const metro = metroMap[code];
      return `${metro.city} (${metro.airport})`;
    })
    .join(' → ');

const fakeBookingFromReference = (reference, surname) => {
  const seed = hash(`${reference}${surname}`.toUpperCase());
  const pair = samplePairs[seed % samplePairs.length];
  const itinerary = buildItinerary(pair[0], pair[1]);

  const travelDate = new Date();
  travelDate.setDate(travelDate.getDate() + ((seed % 40) + 3));

  const depHour = 6 + (seed % 14);
  const depMinute = seed % 2 ? '15' : '40';

  return {
    reference: reference.toUpperCase(),
    passenger: surname,
    itineraryLine: formatRoute(itinerary),
    flightNumber: `NA${1000 + (seed % 9000)}`,
    departure: `${travelDate.toLocaleDateString()} ${depHour.toString().padStart(2, '0')}:${depMinute}`,
    cabin: ['Economy', 'Premium Economy', 'Business'][seed % 3],
    status: ['Confirmed', 'Ticketed', 'Confirmed'][seed % 3],
  };
};

const ManagePage = () => {
  const [reference, setReference] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();

    const validReference = /^[A-Za-z0-9]{6}$/.test(reference.trim());
    if (!validReference) {
      setError('Booking reference must be exactly 6 alphanumeric characters.');
      setBooking(null);
      return;
    }

    if (!lastName.trim()) {
      setError('Enter the passenger last name.');
      setBooking(null);
      return;
    }

    setError('');
    setBooking(fakeBookingFromReference(reference.trim(), lastName.trim()));
  };

  return (
    <section className="section">
      <div className="container narrow">
        <div className="page-heading">
          <h1>Manage Booking</h1>
          <p>Retrieve your trip, review itinerary details, and update selected services.</p>
        </div>

        <form className="surface-card form-card" onSubmit={handleSubmit}>
          <label htmlFor="bookingReference">
            Booking reference
            <input
              id="bookingReference"
              className="field"
              maxLength={6}
              placeholder="ABC123"
              value={reference}
              onChange={(event) => setReference(event.target.value.toUpperCase())}
            />
          </label>

          <label htmlFor="lastName">
            Last name
            <input
              id="lastName"
              className="field"
              placeholder="Passenger surname"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit" className="primary-btn">
            Find booking
          </button>
        </form>

        {booking ? (
          <article className="surface-card booking-found-card">
            <div>
              <h3>{booking.itineraryLine}</h3>
              <p>
                Reference {booking.reference} | {booking.status}
              </p>
            </div>
            <div className="booking-found-grid">
              <p>
                <strong>Passenger:</strong> {booking.passenger}
              </p>
              <p>
                <strong>Flight:</strong> {booking.flightNumber}
              </p>
              <p>
                <strong>Departure:</strong> {booking.departure}
              </p>
              <p>
                <strong>Cabin:</strong> {booking.cabin}
              </p>
            </div>
            <div className="booking-tools">
              <button type="button" className="secondary-btn">
                Change seat
              </button>
              <button type="button" className="secondary-btn">
                Add bags
              </button>
              <button type="button" className="primary-btn">
                Upgrade
              </button>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
};

export default ManagePage;
