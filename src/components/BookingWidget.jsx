import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { metros, metroSearchLabel, metroMap } from '../data/metros';
import { mainCityByMetroCode } from '../data/mainCities';
import {
  generateSearchResults,
  passengerSummary,
  validateSearchInput,
} from '../lib/flightEngine';
import AutocompleteInput from './AutocompleteInput';
import PassengerDropdown from './PassengerDropdown';
import Stepper from './Stepper';
import FlightCard from './FlightCard';
import './BookingWidget.css';

const LAST_SEARCH_KEY = 'aera:lastSearch';

const isoDate = (date) => date.toISOString().slice(0, 10);

const nextDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return isoDate(date);
};

const tryLoadLastSearch = () => {
  try {
    const raw = localStorage.getItem(LAST_SEARCH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const saveLastSearch = (search) => {
  try {
    localStorage.setItem(
      LAST_SEARCH_KEY,
      JSON.stringify({
        fromCode: search.fromCode,
        toCode: search.toCode,
        departureDate: search.departureDate,
        returnDate: search.returnDate,
        tripType: search.tripType,
        cabin: search.cabin,
        passengers: search.passengers,
      }),
    );
  } catch {
    // Local storage is optional and should not block booking flow.
  }
};

const resolveFromText = (text) => {
  const lowered = text.trim().toLowerCase();
  if (!lowered) return '';
  const found = metros.find(
    (metro) =>
      metro.code.toLowerCase() === lowered || metroSearchLabel(metro.code).toLowerCase() === lowered,
  );
  return found?.code || '';
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const AirportCodeTrail = ({ itineraryCodes = [] }) => (
  <p className="airport-code-trail">
    {itineraryCodes.map((code, index) => {
      const metro = metroMap[code];
      const city = mainCityByMetroCode[code];

      return (
        <Fragment key={`${code}-${index}`}>
          {city ? (
            <Link to={`/cities/${city.slug}`} className="airport-link">
              {metro.airport}
            </Link>
          ) : (
            <span>{metro.airport}</span>
          )}
          {index < itineraryCodes.length - 1 ? <span className="trail-arrow">-></span> : null}
        </Fragment>
      );
    })}
  </p>
);

const BookingWidget = ({ preferredAircraft = '', prefillFrom = '', prefillTo = '' }) => {
  const cached = typeof window !== 'undefined' ? tryLoadLastSearch() : null;
  const initialFromCode = metroMap[prefillFrom] ? prefillFrom : cached?.fromCode || '';
  const initialToCode = metroMap[prefillTo] ? prefillTo : cached?.toCode || '';

  const [search, setSearch] = useState(() => ({
    fromCode: initialFromCode,
    toCode: initialToCode,
    fromText: initialFromCode ? metroSearchLabel(initialFromCode) : '',
    toText: initialToCode ? metroSearchLabel(initialToCode) : '',
    departureDate: cached?.departureDate || nextDays(14),
    tripType: cached?.tripType || 'One-way',
    returnDate: cached?.returnDate || nextDays(21),
    cabin: cached?.cabin || 'Economy',
    passengers: cached?.passengers || { adults: 1, teens: 0, children: 0, infants: 0 },
    preferredAircraft,
  }));

  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [flowStep, setFlowStep] = useState(1);
  const [selectedOutbound, setSelectedOutbound] = useState('');
  const [selectedReturn, setSelectedReturn] = useState('');

  useEffect(() => {
    setSearch((prev) => {
      const next = {};

      if (prefillFrom && metroMap[prefillFrom] && prefillFrom !== prev.fromCode) {
        next.fromCode = prefillFrom;
        next.fromText = metroSearchLabel(prefillFrom);
      }

      if (prefillTo && metroMap[prefillTo] && prefillTo !== prev.toCode) {
        next.toCode = prefillTo;
        next.toText = metroSearchLabel(prefillTo);
      }

      if (preferredAircraft && preferredAircraft !== prev.preferredAircraft) {
        next.preferredAircraft = preferredAircraft;
      }

      return Object.keys(next).length ? { ...prev, ...next } : prev;
    });
  }, [prefillFrom, prefillTo, preferredAircraft]);

  const sortedMetros = useMemo(() => [...metros].sort((a, b) => a.city.localeCompare(b.city)), []);

  const isRoundTrip = search.tripType === 'Round-trip';
  const outboundFlight = results?.outboundOptions.find((option) => option.id === selectedOutbound);
  const returnFlight = results?.returnOptions.find((option) => option.id === selectedReturn);

  const stepperSteps = isRoundTrip
    ? ['Select Departure Flight', 'Select Return Flight', 'Review & Book']
    : ['Select Departure Flight', 'Review & Book'];

  const stepperIndex = isRoundTrip ? flowStep : Math.min(flowStep, 2);

  const isSummaryVisible = (!isRoundTrip && flowStep === 2) || (isRoundTrip && flowStep === 3);

  const tripTotal = (outboundFlight?.subtotal || 0) + (returnFlight?.subtotal || 0);

  const updateSearch = (patch) => {
    setSearch((prev) => ({ ...prev, ...patch }));
  };

  const onSubmit = (event) => {
    event.preventDefault();

    const validationError = validateSearchInput({
      fromCode: search.fromCode,
      toCode: search.toCode,
      departureDate: search.departureDate,
      tripType: search.tripType,
      returnDate: search.returnDate,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    const freshResults = generateSearchResults(search);
    setResults(freshResults);
    setError('');
    setFlowStep(1);
    setSelectedOutbound('');
    setSelectedReturn('');
    saveLastSearch(search);
  };

  const onContinue = () => {
    if (flowStep === 1 && !selectedOutbound) return;

    if (isRoundTrip) {
      if (flowStep === 1) {
        setFlowStep(2);
      } else if (flowStep === 2 && selectedReturn) {
        setFlowStep(3);
      }
      return;
    }

    if (flowStep === 1) {
      setFlowStep(2);
    }
  };

  return (
    <section className="booking-widget surface-card">
      <form className={`booking-form ${isRoundTrip ? 'round' : 'oneway'}`} onSubmit={onSubmit}>
        <AutocompleteInput
          id="fromMetro"
          label="From"
          value={search.fromText}
          options={sortedMetros}
          onTextChange={(text) => updateSearch({ fromText: text, fromCode: resolveFromText(text) })}
          onSelect={(metro) => updateSearch({ fromCode: metro.code, fromText: metroSearchLabel(metro.code) })}
        />

        <AutocompleteInput
          id="toMetro"
          label="To"
          value={search.toText}
          options={sortedMetros}
          onTextChange={(text) => updateSearch({ toText: text, toCode: resolveFromText(text) })}
          onSelect={(metro) => updateSearch({ toCode: metro.code, toText: metroSearchLabel(metro.code) })}
        />

        <label className="booking-field" htmlFor="departureDate">
          Departure
          <input
            id="departureDate"
            type="date"
            className="field"
            value={search.departureDate}
            onChange={(event) => updateSearch({ departureDate: event.target.value })}
          />
        </label>

        <label className="booking-field" htmlFor="tripType">
          Trip
          <select
            id="tripType"
            value={search.tripType}
            onChange={(event) => {
              const nextType = event.target.value;
              updateSearch({
                tripType: nextType,
                returnDate: nextType === 'Round-trip' ? search.returnDate || nextDays(21) : '',
              });
            }}
          >
            <option>One-way</option>
            <option>Round-trip</option>
          </select>
        </label>

        {isRoundTrip ? (
          <label className="booking-field" htmlFor="returnDate">
            Return
            <input
              id="returnDate"
              type="date"
              className="field"
              value={search.returnDate}
              onChange={(event) => updateSearch({ returnDate: event.target.value })}
            />
          </label>
        ) : null}

        <label className="booking-field" htmlFor="cabinClass">
          Cabin
          <select
            id="cabinClass"
            value={search.cabin}
            onChange={(event) => updateSearch({ cabin: event.target.value })}
          >
            <option>Economy</option>
            <option>Premium Economy</option>
            <option>Business</option>
            <option>First</option>
          </select>
        </label>

        <PassengerDropdown
          passengers={search.passengers}
          onChange={(next) => updateSearch({ passengers: next })}
        />

        <div className="booking-submit-cell">
          <button type="submit" className="primary-btn search-btn">
            Search flights
          </button>
        </div>
      </form>

      {preferredAircraft ? (
        <p className="booking-tip">
          Showing schedules with preference for <strong>{preferredAircraft.toUpperCase()}</strong> where range
          permits.
        </p>
      ) : null}

      {error ? <p className="booking-error">{error}</p> : null}

      {results ? (
        <div className="results-wrap">
          <Stepper steps={stepperSteps} currentStep={stepperIndex} />

          {flowStep === 1 ? (
            <div className="step-panel">
              <h3>Select Departure Flight</h3>
              <div className="flight-grid">
                {results.outboundOptions.map((option) => (
                  <FlightCard
                    key={option.id}
                    option={option}
                    selected={selectedOutbound === option.id}
                    onSelect={setSelectedOutbound}
                  />
                ))}
              </div>
              <div className="step-actions">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={onContinue}
                  disabled={!selectedOutbound}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {isRoundTrip && flowStep === 2 ? (
            <div className="step-panel">
              <h3>Select Return Flight</h3>
              <div className="flight-grid">
                {results.returnOptions.map((option) => (
                  <FlightCard
                    key={option.id}
                    option={option}
                    selected={selectedReturn === option.id}
                    onSelect={setSelectedReturn}
                  />
                ))}
              </div>
              <div className="step-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setFlowStep(1)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={onContinue}
                  disabled={!selectedReturn}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {isSummaryVisible ? (
            <div className="step-panel summary-panel">
              <h3>Trip Summary</h3>
              <div className="summary-grid">
                <article className="summary-box surface-card">
                  <h4>Passengers</h4>
                  <p>{passengerSummary(search.passengers)}</p>
                  <p>{search.cabin}</p>
                </article>

                <article className="summary-box surface-card">
                  <h4>Outbound</h4>
                  {outboundFlight ? (
                    <>
                      <p>{outboundFlight.itineraryLine}</p>
                      <AirportCodeTrail itineraryCodes={outboundFlight.itineraryCodes} />
                      <p>
                        {outboundFlight.flightNumber} | {outboundFlight.aircraftName}
                      </p>
                      <p>
                        {outboundFlight.departureTime} → {outboundFlight.arrivalTime}
                      </p>
                      <strong>{formatCurrency(outboundFlight.subtotal)}</strong>
                    </>
                  ) : (
                    <p>No outbound selected.</p>
                  )}
                </article>

                {isRoundTrip ? (
                  <article className="summary-box surface-card">
                    <h4>Return</h4>
                    {returnFlight ? (
                      <>
                        <p>{returnFlight.itineraryLine}</p>
                        <AirportCodeTrail itineraryCodes={returnFlight.itineraryCodes} />
                        <p>
                          {returnFlight.flightNumber} | {returnFlight.aircraftName}
                        </p>
                        <p>
                          {returnFlight.departureTime} → {returnFlight.arrivalTime}
                        </p>
                        <strong>{formatCurrency(returnFlight.subtotal)}</strong>
                      </>
                    ) : (
                      <p>No return selected.</p>
                    )}
                  </article>
                ) : null}

                <article className="summary-box total-box surface-card">
                  <h4>Total</h4>
                  <p>
                    {metroMap[search.fromCode]?.city || search.fromCode} to{' '}
                    {metroMap[search.toCode]?.city || search.toCode}
                  </p>
                  <strong>{formatCurrency(tripTotal)}</strong>
                  <div className="summary-actions">
                    {isRoundTrip ? (
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setFlowStep(2)}
                      >
                        Back
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setFlowStep(1)}
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => window.alert('Booking confirmed (demo).')}
                    >
                      Book
                    </button>
                  </div>
                </article>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default BookingWidget;
