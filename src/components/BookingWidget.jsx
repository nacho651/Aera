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

const maskCardNumber = (number) => {
  const digits = (number || '').replace(/\D/g, '');
  if (!digits) return '****';
  const tail = digits.slice(-4).padStart(4, '*');
  return `**** **** **** ${tail}`;
};

const passengerGroups = [
  ['adults', 'Adult'],
  ['teens', 'Teen'],
  ['children', 'Child'],
  ['infants', 'Infant'],
];

const buildPassengerManifest = (passengers) => {
  const manifest = [];
  passengerGroups.forEach(([key, label]) => {
    const count = passengers[key] || 0;
    for (let i = 0; i < count; i += 1) {
      manifest.push({
        id: `${key}-${i + 1}`,
        label: `${label} ${i + 1}`,
      });
    }
  });
  return manifest;
};

const validatePassengerDetails = (passengerForm, manifest) => {
  if (!passengerForm.contactFirstName.trim() || !passengerForm.contactLastName.trim()) {
    return 'Enter contact first and last name.';
  }

  const email = passengerForm.contactEmail.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Enter a valid contact email.';
  }

  if (!passengerForm.contactPhone.trim()) {
    return 'Enter a contact phone number.';
  }

  for (const traveler of manifest) {
    const details = passengerForm.travelers[traveler.id] || { firstName: '', lastName: '' };
    if (!details.firstName.trim() || !details.lastName.trim()) {
      return `Complete details for ${traveler.label}.`;
    }
  }

  return '';
};

const validatePaymentDetails = (paymentForm) => {
  const cardNumber = paymentForm.cardNumber.replace(/\D/g, '');
  if (cardNumber.length < 13 || cardNumber.length > 19) {
    return 'Enter a valid card number.';
  }

  if (!paymentForm.cardName.trim()) {
    return 'Enter the cardholder name.';
  }

  const month = Number(paymentForm.expMonth);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return 'Enter a valid expiry month.';
  }

  const rawYear = paymentForm.expYear.trim();
  let year = Number(rawYear);
  if (!Number.isInteger(year)) {
    return 'Enter a valid expiry year.';
  }
  if (rawYear.length === 2) year += 2000;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return 'Card expiry date is in the past.';
  }

  const cvv = paymentForm.cvv.replace(/\D/g, '');
  if (cvv.length < 3 || cvv.length > 4) {
    return 'Enter a valid security code.';
  }

  if (!paymentForm.billingZip.trim()) {
    return 'Enter a billing ZIP/postal code.';
  }

  return '';
};

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
          {index < itineraryCodes.length - 1 ? <span className="trail-arrow">-&gt;</span> : null}
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
  const [bookingMessage, setBookingMessage] = useState('');
  const [passengerForm, setPassengerForm] = useState({
    contactFirstName: '',
    contactLastName: '',
    contactEmail: '',
    contactPhone: '',
    travelers: {},
  });
  const [paymentForm, setPaymentForm] = useState({
    cardName: '',
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvv: '',
    billingZip: '',
  });

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

  const passengerManifest = useMemo(() => buildPassengerManifest(search.passengers), [search.passengers]);

  useEffect(() => {
    setPassengerForm((prev) => {
      const nextTravelers = {};
      passengerManifest.forEach((traveler) => {
        nextTravelers[traveler.id] = prev.travelers[traveler.id] || { firstName: '', lastName: '' };
      });
      return {
        ...prev,
        travelers: nextTravelers,
      };
    });
  }, [passengerManifest]);

  const isRoundTrip = search.tripType === 'Round-trip';
  const outboundFlight = results?.outboundOptions.find((option) => option.id === selectedOutbound);
  const returnFlight = results?.returnOptions.find((option) => option.id === selectedReturn);

  const selectionEndStep = isRoundTrip ? 2 : 1;
  const passengerInfoStep = selectionEndStep + 1;
  const paymentStep = selectionEndStep + 2;
  const summaryStep = selectionEndStep + 3;

  const stepperSteps = isRoundTrip
    ? ['Select Departure Flight', 'Select Return Flight', 'Passenger Info', 'Payment', 'Review & Book']
    : ['Select Departure Flight', 'Passenger Info', 'Payment', 'Review & Book'];

  const isSummaryVisible = flowStep === summaryStep;
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
    setBookingMessage('');
    setFlowStep(1);
    setSelectedOutbound('');
    setSelectedReturn('');
    saveLastSearch(search);
  };

  const onContinue = () => {
    if (flowStep === 1 && !selectedOutbound) return;

    if (isRoundTrip && flowStep === 2 && !selectedReturn) return;

    if (flowStep === passengerInfoStep) {
      const passengerError = validatePassengerDetails(passengerForm, passengerManifest);
      if (passengerError) {
        setError(passengerError);
        return;
      }
    }

    if (flowStep === paymentStep) {
      const paymentError = validatePaymentDetails(paymentForm);
      if (paymentError) {
        setError(paymentError);
        return;
      }
    }

    setError('');
    setFlowStep((prev) => prev + 1);
  };

  const goBack = () => {
    setError('');
    setBookingMessage('');
    setFlowStep((prev) => Math.max(1, prev - 1));
  };

  const onBook = () => {
    setBookingMessage(
      `Payment authorized on ${maskCardNumber(paymentForm.cardNumber)}. Booking created for ${passengerManifest.length} passenger(s).`,
    );
  };

  const updateTraveler = (travelerId, patch) => {
    setPassengerForm((prev) => ({
      ...prev,
      travelers: {
        ...prev.travelers,
        [travelerId]: {
          ...(prev.travelers[travelerId] || { firstName: '', lastName: '' }),
          ...patch,
        },
      },
    }));
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
          <select id="cabinClass" value={search.cabin} onChange={(event) => updateSearch({ cabin: event.target.value })}>
            <option>Economy</option>
            <option>Premium Economy</option>
            <option>Business</option>
            <option>First</option>
          </select>
        </label>

        <PassengerDropdown passengers={search.passengers} onChange={(next) => updateSearch({ passengers: next })} />

        <div className="booking-submit-cell">
          <button type="submit" className="primary-btn search-btn">
            Search flights
          </button>
        </div>
      </form>

      {preferredAircraft ? (
        <p className="booking-tip">
          Showing schedules with preference for <strong>{preferredAircraft.toUpperCase()}</strong> where range permits.
        </p>
      ) : null}

      {error ? <p className="booking-error">{error}</p> : null}

      {results ? (
        <div className="results-wrap">
          <Stepper steps={stepperSteps} currentStep={flowStep} />

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
                <button type="button" className="primary-btn" onClick={onContinue} disabled={!selectedOutbound}>
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
                <button type="button" className="secondary-btn" onClick={goBack}>
                  Back
                </button>
                <button type="button" className="primary-btn" onClick={onContinue} disabled={!selectedReturn}>
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {flowStep === passengerInfoStep ? (
            <div className="step-panel summary-panel">
              <h3>Passenger Information</h3>
              <article className="summary-box surface-card booking-form-section">
                <h4>Primary Contact</h4>
                <div className="detail-grid contact-grid">
                  <label className="booking-field" htmlFor="contactFirstName">
                    First name
                    <input
                      id="contactFirstName"
                      className="field"
                      value={passengerForm.contactFirstName}
                      onChange={(event) =>
                        setPassengerForm((prev) => ({ ...prev, contactFirstName: event.target.value }))
                      }
                    />
                  </label>
                  <label className="booking-field" htmlFor="contactLastName">
                    Last name
                    <input
                      id="contactLastName"
                      className="field"
                      value={passengerForm.contactLastName}
                      onChange={(event) =>
                        setPassengerForm((prev) => ({ ...prev, contactLastName: event.target.value }))
                      }
                    />
                  </label>
                  <label className="booking-field" htmlFor="contactEmail">
                    Email
                    <input
                      id="contactEmail"
                      type="email"
                      className="field"
                      value={passengerForm.contactEmail}
                      onChange={(event) =>
                        setPassengerForm((prev) => ({ ...prev, contactEmail: event.target.value }))
                      }
                    />
                  </label>
                  <label className="booking-field" htmlFor="contactPhone">
                    Phone
                    <input
                      id="contactPhone"
                      className="field"
                      value={passengerForm.contactPhone}
                      onChange={(event) =>
                        setPassengerForm((prev) => ({ ...prev, contactPhone: event.target.value }))
                      }
                    />
                  </label>
                </div>
              </article>

              <article className="summary-box surface-card booking-form-section">
                <h4>Traveler Details</h4>
                <div className="detail-grid traveler-grid">
                  {passengerManifest.map((traveler) => (
                    <div className="traveler-row" key={traveler.id}>
                      <p className="traveler-label">{traveler.label}</p>
                      <label className="booking-field" htmlFor={`${traveler.id}-first`}>
                        First name
                        <input
                          id={`${traveler.id}-first`}
                          className="field"
                          value={passengerForm.travelers[traveler.id]?.firstName || ''}
                          onChange={(event) => updateTraveler(traveler.id, { firstName: event.target.value })}
                        />
                      </label>
                      <label className="booking-field" htmlFor={`${traveler.id}-last`}>
                        Last name
                        <input
                          id={`${traveler.id}-last`}
                          className="field"
                          value={passengerForm.travelers[traveler.id]?.lastName || ''}
                          onChange={(event) => updateTraveler(traveler.id, { lastName: event.target.value })}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </article>

              <div className="step-actions">
                <button type="button" className="secondary-btn" onClick={goBack}>
                  Back
                </button>
                <button type="button" className="primary-btn" onClick={onContinue}>
                  Continue to payment
                </button>
              </div>
            </div>
          ) : null}

          {flowStep === paymentStep ? (
            <div className="step-panel summary-panel">
              <h3>Payment</h3>
              <article className="summary-box surface-card booking-form-section">
                <h4>Card Details (Demo)</h4>
                <div className="detail-grid payment-grid">
                  <label className="booking-field" htmlFor="cardName">
                    Cardholder name
                    <input
                      id="cardName"
                      className="field"
                      value={paymentForm.cardName}
                      onChange={(event) => setPaymentForm((prev) => ({ ...prev, cardName: event.target.value }))}
                    />
                  </label>

                  <label className="booking-field" htmlFor="cardNumber">
                    Card number
                    <input
                      id="cardNumber"
                      className="field"
                      inputMode="numeric"
                      value={paymentForm.cardNumber}
                      onChange={(event) => setPaymentForm((prev) => ({ ...prev, cardNumber: event.target.value }))}
                    />
                  </label>

                  <label className="booking-field" htmlFor="expMonth">
                    Exp. month
                    <input
                      id="expMonth"
                      className="field"
                      inputMode="numeric"
                      placeholder="MM"
                      value={paymentForm.expMonth}
                      onChange={(event) => setPaymentForm((prev) => ({ ...prev, expMonth: event.target.value }))}
                    />
                  </label>

                  <label className="booking-field" htmlFor="expYear">
                    Exp. year
                    <input
                      id="expYear"
                      className="field"
                      inputMode="numeric"
                      placeholder="YYYY"
                      value={paymentForm.expYear}
                      onChange={(event) => setPaymentForm((prev) => ({ ...prev, expYear: event.target.value }))}
                    />
                  </label>

                  <label className="booking-field" htmlFor="cvv">
                    Security code
                    <input
                      id="cvv"
                      className="field"
                      inputMode="numeric"
                      value={paymentForm.cvv}
                      onChange={(event) => setPaymentForm((prev) => ({ ...prev, cvv: event.target.value }))}
                    />
                  </label>

                  <label className="booking-field" htmlFor="billingZip">
                    ZIP / Postal code
                    <input
                      id="billingZip"
                      className="field"
                      value={paymentForm.billingZip}
                      onChange={(event) => setPaymentForm((prev) => ({ ...prev, billingZip: event.target.value }))}
                    />
                  </label>
                </div>
              </article>

              <div className="step-actions">
                <button type="button" className="secondary-btn" onClick={goBack}>
                  Back
                </button>
                <button type="button" className="primary-btn" onClick={onContinue}>
                  Continue to review
                </button>
              </div>
            </div>
          ) : null}

          {isSummaryVisible ? (
            <div className="step-panel summary-panel">
              <h3>Trip Summary</h3>
              {bookingMessage ? <p className="booking-success">{bookingMessage}</p> : null}
              <div className="summary-grid">
                <article className="summary-box surface-card">
                  <h4>Passengers</h4>
                  <p>{passengerSummary(search.passengers)}</p>
                  <p>Requested cabin: {search.cabin}</p>
                  <p>
                    Contact: {passengerForm.contactFirstName} {passengerForm.contactLastName}
                  </p>
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
                        Cabin: {outboundFlight.offeredCabinSummary}
                        {outboundFlight.requestedCabin !== outboundFlight.offeredCabinSummary
                          ? ` (requested: ${outboundFlight.requestedCabin})`
                          : ''}
                      </p>
                      {outboundFlight.segments?.length > 1 ? (
                        <div className="summary-segment-aircraft">
                          {outboundFlight.segments.map((segment) => (
                            <p key={`out-${segment.fromCode}-${segment.toCode}`}>
                              {segment.fromAirport}-{segment.toAirport}: {segment.aircraftName} ({segment.offeredCabinClass})
                            </p>
                          ))}
                        </div>
                      ) : null}
                      <p>
                        {outboundFlight.departureTime} → {outboundFlight.arrivalTime}
                      </p>
                      <p>
                        {outboundFlight.departureTimeZone} / {outboundFlight.arrivalTimeZone}
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
                          Cabin: {returnFlight.offeredCabinSummary}
                          {returnFlight.requestedCabin !== returnFlight.offeredCabinSummary
                            ? ` (requested: ${returnFlight.requestedCabin})`
                            : ''}
                        </p>
                        {returnFlight.segments?.length > 1 ? (
                          <div className="summary-segment-aircraft">
                            {returnFlight.segments.map((segment) => (
                              <p key={`ret-${segment.fromCode}-${segment.toCode}`}>
                                {segment.fromAirport}-{segment.toAirport}: {segment.aircraftName} ({segment.offeredCabinClass})
                              </p>
                            ))}
                          </div>
                        ) : null}
                        <p>
                          {returnFlight.departureTime} → {returnFlight.arrivalTime}
                        </p>
                        <p>
                          {returnFlight.departureTimeZone} / {returnFlight.arrivalTimeZone}
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
                    {metroMap[search.fromCode]?.city || search.fromCode} to {metroMap[search.toCode]?.city || search.toCode}
                  </p>
                  <p>Payment method: {maskCardNumber(paymentForm.cardNumber)}</p>
                  <strong>{formatCurrency(tripTotal)}</strong>
                  <div className="summary-actions">
                    <button type="button" className="secondary-btn" onClick={goBack}>
                      Back
                    </button>
                    <button type="button" className="primary-btn" onClick={onBook}>
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
