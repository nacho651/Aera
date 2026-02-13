import './FlightCard.css';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const FlightCard = ({ option, selected, onSelect }) => (
  <button type="button" className={`flight-card${selected ? ' selected' : ''}`} onClick={() => onSelect(option.id)}>
    <div className="flight-top">
      <div>
        <h4>{option.itineraryLine}</h4>
        <p>
          {option.flightNumber} | {option.aircraftName}
        </p>
        {option.segments?.length > 1 ? (
          <div className="segment-aircraft-list">
            {option.segments.map((segment) => (
              <p key={`${segment.fromCode}-${segment.toCode}`}>
                {segment.fromAirport}-{segment.toAirport}: {segment.aircraftName} ({segment.offeredCabinClass})
              </p>
            ))}
          </div>
        ) : null}
        <p className="offered-cabin-line">
          Cabin: {option.offeredCabinSummary}
          {option.requestedCabin !== option.offeredCabinSummary
            ? ` (requested: ${option.requestedCabin})`
            : ''}
        </p>
      </div>
      <div className="flight-time">
        <strong>
          {option.departureTime} → {option.arrivalTime}
          {option.dayShift ? ` ${option.dayShift}` : ''}
        </strong>
        <span>
          {option.departureTimeZone} / {option.arrivalTimeZone}
        </span>
        <span>{option.duration}</span>
      </div>
    </div>

    <div className="flight-pricing">
      {option.pricing.items.map((item) => (
        <p key={item.category}>
          {item.label}: {item.count} x {formatCurrency(item.each)}
        </p>
      ))}
      <p className="flight-subtotal">Subtotal: {formatCurrency(option.subtotal)}</p>
    </div>
  </button>
);

export default FlightCard;
