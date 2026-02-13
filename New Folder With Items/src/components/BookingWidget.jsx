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
    // Local storage is optional.
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

const makeBookingReference = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = '';
  for (let i = 0; i < 6; i += 1) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return ref;
};

const maskCardNumber = (value) => {
  const digits = (value || '').replace(/\D/g, '');
  const tail = digits.slice(-4).padStart(4, '*');
  return `**** **** **** ${tail}`;
};

const passengerGroups = [
  ['adults', 'Adult'],
  ['teens', 'Teen'],
  ['children', 'Child'],
  ['infants', 'Infant'],
];

const emptyTraveler = () => ({
  firstName: '',
  lastName: '',
  dob: '',
  passport: '',
});

const buildPassengerManifest = (passengers) => {
  const manifest = [];
  passengerGroups.forEach(([groupKey, groupLabel]) => {
    const count = passengers[groupKey] || 0;
    for (let i = 0; i < count; i += 1) {
      manifest.push({
        id: `${groupKey}-${i + 1}`,
        label: `${groupLabel} ${i + 1}`,
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
    const details = passengerForm.travelers[traveler.id] || emptyTraveler();
    if (
      !details.firstName.trim() ||
      !details.lastName.trim() ||
      !details.dob ||
      !details.passport.trim()
    ) {
      return `Complete details for ${traveler.label}.`;
    }

    const dob = new Date(`${details.dob}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(dob.getTime()) || dob >= today) {
      return `Enter a valid date of birth for ${traveler.label}.`;
    }
  }

  return '';
};

const validatePaymentDetails = (paymentForm) => {
  const cardDigits = paymentForm.cardNumber.replace(/\D/g, '');
  if (cardDigits.length < 13 || cardDigits.length > 19) {
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
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
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
  const [bookingRef, setBookingRef] = useState('');

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
      const patch = {};

      if (prefillFrom && metroMap[prefillFrom] && prefillFrom !== prev.fromCode) {
        patch.fromCode = prefillFrom;
        patch.fromText = metroSearchLabel(prefillFrom);
      }

      if (prefillTo && metroMap[prefillTo] && prefillTo !== prev.toCode) {
        patch.toCode = prefillTo;
        patch.toText = metroSearchLabel(prefillTo);
      }

      if (preferredAircraft && preferredAircraft !== prev.preferredAircraft) {
        patch.preferredAircraft = preferredAircraft;
      }

      return Object.keys(patch).length ? { ...prev, ...patch } : prev;
    });
  }, [prefillFrom, prefillTo, preferredAircraft]);

  const sortedMetros = useMemo(() => [...metros].sort((a, b) => a.city.localeCompare(b.city)), []);
  const isRoundTrip = search.tripType === 'Round-trip';
  const manifest = useMemo(() => buildPassengerManifest(search.passengers), [search.passengers]);

  useEffect(() => {
    setPassengerForm((prev) => {
      const nextTravelers = {};
      manifest.forEach((traveler) => {
        nextTravelers[traveler.id] = prev.travelers[traveler.id] || emptyTraveler();
      });
      return {
        ...prev,
        travelers: nextTravelers,
      };
    });
  }, [manifest]);

  const outbound = results?.outboundOptions.find((option) => option.id === selectedOutbound);
  const inbound = results?.returnOptions.find((option) => option.id === selectedReturn);

  const selectionEndStep = isRoundTrip ? 2 : 1;
  const passengerStep = selectionEndStep + 1;
  const paymentStep = selectionEndStep + 2;
  const summaryStep = selectionEndStep + 3;

  const steps = isRoundTrip
    ? ['Select Departure Flight', 'Select Return Flight', 'Passenger Info', 'Payment', 'Review & Book']
    : ['Select Departure Flight', 'Passenger Info', 'Payment', 'Review & Book'];

  const isSummary = flowStep === summaryStep;
  const total = (outbound?.subtotal || 0) + (inbound?.subtotal || 0);

  const updateSearch = (patch) => setSearch((prev) => ({ ...prev, ...patch }));

  const resetAfterSearch = (freshResults) => {
    setResults(freshResults);
    setFlowStep(1);
    setSelectedOutbound('');
    setSelectedReturn('');
    setBookingMessage('');
    setBookingRef('');
    setError('');
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

    resetAfterSearch(generateSearchResults(search));
    saveLastSearch(search);
  };

  const onContinue = () => {
    if (flowStep === 1 && !selectedOutbound) return;
    if (isRoundTrip && flowStep === 2 && !selectedReturn) return;

    if (flowStep === passengerStep) {
      const passengerError = validatePassengerDetails(passengerForm, manifest);
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

  const onBack = () => {
    setError('');
    setBookingMessage('');
    setFlowStep((prev) => Math.max(1, prev - 1));
  };

  const onConfirmBooking = () => {
    const reference = bookingRef || makeBookingReference();
    setBookingRef(reference);
    setBookingMessage(
      `Payment authorized on ${maskCardNumber(paymentForm.cardNumber)}. Booking ${reference} confirmed. Receipt generated (demo).`,
    );
  };

  const updateTraveler = (travelerId, patch) => {
    setPassengerForm((prev) => ({
      ...prev,
      travelers: {
        ...prev.travelers,
        [travelerId]: {
          ...(prev.travelers[travelerId] || emptyTraveler()),
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
          <Stepper steps={steps} currentStep={flowStep} />

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
                <button type="button" className="secondary-btn" onClick={onBack}>
                  Back
                </button>
                <button type="button" className="primary-btn" onClick={onContinue} disabled={!selectedReturn}>
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {flowStep === passengerStep ? (
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
                  {manifest.map((traveler) => (
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

                      <label className="booking-field" htmlFor={`${traveler.id}-dob`}>
                        Date of birth
                        <input
                          id={`${traveler.id}-dob`}
                          type="date"
                          className="field"
                          value={passengerForm.travelers[traveler.id]?.dob || ''}
                          onChange={(event) => updateTraveler(traveler.id, { dob: event.target.value })}
                        />
                      </label>

                      <label className="booking-field" htmlFor={`${traveler.id}-passport`}>
                        Passport number
                        <input
                          id={`${traveler.id}-passport`}
                          className="field"
                          value={passengerForm.travelers[traveler.id]?.passport || ''}
                          onChange={(event) =>
                            updateTraveler(traveler.id, { passport: event.target.value.toUpperCase() })
                          }
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </article>

              <div className="step-actions">
                <button type="button" className="secondary-btn" onClick={onBack}>
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
                <button type="button" className="secondary-btn" onClick={onBack}>
                  Back
                </button>
                <button type="button" className="primary-btn" onClick={onContinue}>
                  Continue to review
                </button>
              </div>
            </div>
          ) : null}

          {isSummary ? (
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
                  {bookingRef ? <p>Booking reference: {bookingRef}</p> : null}
                </article>

                <article className="summary-box surface-card">
                  <h4>Outbound</h4>
                  {outbound ? (
                    <>
                      <p>{outbound.itineraryLine}</p>
                      <AirportCodeTrail itineraryCodes={outbound.itineraryCodes} />
                      <p>
                        {outbound.flightNumber} | {outbound.aircraftName}
                      </p>
                      <p>
                        Cabin: {outbound.offeredCabinSummary}
                        {outbound.requestedCabin !== outbound.offeredCabinSummary
                          ? ` (requested: ${outbound.requestedCabin})`
                          : ''}
                      </p>
                      {outbound.segments?.length > 1 ? (
                        <div className="summary-segment-aircraft">
                          {outbound.segments.map((segment) => (
                            <p key={`out-${segment.fromCode}-${segment.toCode}`}>
                              {segment.fromAirport}-{segment.toAirport}: {segment.aircraftName} ({segment.offeredCabinClass})
                            </p>
                          ))}
                        </div>
                      ) : null}
                      <p>
                        {outbound.departureTime} → {outbound.arrivalTime}
                      </p>
                      <p>
                        {outbound.departureTimeZone} / {outbound.arrivalTimeZone}
                      </p>
                      <strong>{formatCurrency(outbound.subtotal)}</strong>
                    </>
                  ) : (
                    <p>No outbound selected.</p>
                  )}
                </article>

                {isRoundTrip ? (
                  <article className="summary-box surface-card">
                    <h4>Return</h4>
                    {inbound ? (
                      <>
                        <p>{inbound.itineraryLine}</p>
                        <AirportCodeTrail itineraryCodes={inbound.itineraryCodes} />
                        <p>
                          {inbound.flightNumber} | {inbound.aircraftName}
                        </p>
                        <p>
                          Cabin: {inbound.offeredCabinSummary}
                          {inbound.requestedCabin !== inbound.offeredCabinSummary
                            ? ` (requested: ${inbound.requestedCabin})`
                            : ''}
                        </p>
                        {inbound.segments?.length > 1 ? (
                          <div className="summary-segment-aircraft">
                            {inbound.segments.map((segment) => (
                              <p key={`ret-${segment.fromCode}-${segment.toCode}`}>
                                {segment.fromAirport}-{segment.toAirport}: {segment.aircraftName} ({segment.offeredCabinClass})
                              </p>
                            ))}
                          </div>
                        ) : null}
                        <p>
                          {inbound.departureTime} → {inbound.arrivalTime}
                        </p>
                        <p>
                          {inbound.departureTimeZone} / {inbound.arrivalTimeZone}
                        </p>
                        <strong>{formatCurrency(inbound.subtotal)}</strong>
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
                  <strong>{formatCurrency(total)}</strong>
                  <div className="summary-actions">
                    <button type="button" className="secondary-btn" onClick={onBack}>
                      Back
                    </button>
                    <button type="button" className="primary-btn" onClick={onConfirmBooking}>
                      Confirm & Pay
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
