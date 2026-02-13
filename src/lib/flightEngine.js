import { fleetMap } from '../data/fleet';
import { formatUtcOffsetLabel, getMetroUtcOffsetHours, metroMap } from '../data/metros';
import { estimateRouteDemand, recommendAircraftForRoute } from './demandEstimator';

const EARTH_RADIUS_KM = 6371;
const CRUISE_SPEED_KMH = 840;
const CONNECTION_BUFFER_MIN = 85;

const shuttlePairs = new Set(['BUE-MVD', 'MIA-NYC', 'LON-PAR', 'DXB-DOH']);

const cabinMultiplier = {
  Economy: 1,
  'Premium Economy': 1.65,
  Business: 2.45,
  First: 3.55,
};

const categoryMultiplier = {
  adults: 1,
  teens: 0.9,
  children: 0.72,
  infants: 0.15,
};

const frequencyTemplates = {
  1: ['12:40'],
  2: ['09:15', '22:10'],
  3: ['07:05', '14:20', '21:40'],
  4: ['06:30', '10:45', '16:10', '21:35'],
};

const normalizePair = (from, to) => [from, to].sort().join('-');

const toRadians = (degrees) => (degrees * Math.PI) / 180;

export const haversineKm = (fromMetro, toMetro) => {
  const dLat = toRadians(toMetro.lat - fromMetro.lat);
  const dLon = toRadians(toMetro.lon - fromMetro.lon);
  const lat1 = toRadians(fromMetro.lat);
  const lat2 = toRadians(toMetro.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

const isShuttle = (from, to) => shuttlePairs.has(normalizePair(from, to));

const hashNumber = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
};

const generateFlightNumber = ({ routeKey, date, cabin, tripType, leg, index }) => {
  const seed = `${routeKey}|${date}|${cabin}|${tripType}|${leg}|${index}`;
  return `NA${1000 + (hashNumber(seed) % 9000)}`;
};

const addMinutes = (date, minutes) => {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() + minutes);
  return copy;
};

const parseDateTimeToUtc = (dateString, timeString, utcOffsetHours) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hour, minute] = timeString.split(':').map(Number);
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - utcOffsetHours * 3600000;
  return new Date(utcMs);
};

export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const formatClockAtOffset = (utcDate, utcOffsetHours) => {
  const localMs = utcDate.getTime() + utcOffsetHours * 3600000;
  const local = new Date(localMs);
  return `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`;
};

const localDateAtOffsetMs = (utcDate, utcOffsetHours) => {
  const local = new Date(utcDate.getTime() + utcOffsetHours * 3600000);
  return Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
};

export const formatDayShift = (departureUtc, arrivalUtc, departureOffset, arrivalOffset) => {
  const departureDateMs = localDateAtOffsetMs(departureUtc, departureOffset);
  const arrivalDateMs = localDateAtOffsetMs(arrivalUtc, arrivalOffset);

  const dayDiff = Math.round((arrivalDateMs - departureDateMs) / 86400000);
  if (dayDiff <= 0) return '';
  return `+${dayDiff}d`;
};

const determineFrequency = ({ distanceKm, fromCode, toCode, demandProfile }) => {
  if (isShuttle(fromCode, toCode)) return 4;
  if (demandProfile.tier === 'very-high') return distanceKm < 2500 ? 3 : 2;
  if (demandProfile.tier === 'high') return 2;
  if (distanceKm < 900) return 3;
  return 1;
};

const shouldUseFeeder = (metro, otherMetro, totalDistanceKm) => {
  if (!metro.feederHub) return false;
  if (metro.region !== otherMetro.region) return true;
  return totalDistanceKm > 4500;
};

export const buildItinerary = (fromCode, toCode) => {
  const fromMetro = metroMap[fromCode];
  const toMetro = metroMap[toCode];
  if (!fromMetro || !toMetro || fromCode === toCode) return [fromCode, toCode];

  const directDistance = haversineKm(fromMetro, toMetro);
  const fromNeedsFeeder = shouldUseFeeder(fromMetro, toMetro, directDistance);
  const toNeedsFeeder = shouldUseFeeder(toMetro, fromMetro, directDistance);

  const itinerary = [fromCode];

  // Enforce that small long-haul origins flow through major hubs before crossing oceans.
  if (fromNeedsFeeder && fromMetro.feederHub && fromMetro.feederHub !== toCode) {
    itinerary.push(fromMetro.feederHub);
  }

  const lastCore = itinerary[itinerary.length - 1];
  const destinationCore = toNeedsFeeder && toMetro.feederHub ? toMetro.feederHub : toCode;

  if (destinationCore !== lastCore) {
    itinerary.push(destinationCore);
  }

  if (toNeedsFeeder && destinationCore !== toCode) {
    itinerary.push(toCode);
  }

  return itinerary;
};

const itineraryDistance = (itineraryCodes) => {
  let total = 0;
  for (let i = 0; i < itineraryCodes.length - 1; i += 1) {
    const from = metroMap[itineraryCodes[i]];
    const to = metroMap[itineraryCodes[i + 1]];
    total += haversineKm(from, to);
  }
  return total;
};

const itineraryLabel = (itineraryCodes) =>
  itineraryCodes
    .map((code) => {
      const metro = metroMap[code];
      return `${metro.city} (${metro.airport})`;
    })
    .join(' → ');

const computeTripMinutes = (distanceKm, itineraryCodes) => {
  const base = Math.round((distanceKm / CRUISE_SPEED_KMH) * 60);
  const connections = Math.max(0, itineraryCodes.length - 2);
  return base + connections * CONNECTION_BUFFER_MIN + 35;
};

const randomPrice = ({ distanceKm, cabin, demandProfile, isNightFlight }) => {
  const demandMultiplier = {
    low: 0.94,
    medium: 1,
    high: 1.12,
    'very-high': 1.22,
  };

  const premiumBias = demandProfile.isPremiumCorridor ? 1.06 : 1;
  const baseEconomy = Math.max(
    85,
    distanceKm * 0.088 * (demandMultiplier[demandProfile.tier] || 1) * premiumBias,
  );
  const cabinFactor = cabinMultiplier[cabin] || 1;
  const nightFactor = isNightFlight ? 1.06 : 1;
  const marketSwing = 0.86 + Math.random() * 0.38;
  return Math.round(baseEconomy * cabinFactor * nightFactor * marketSwing);
};

const categoryLabel = {
  adults: 'Adults',
  teens: 'Teens',
  children: 'Children',
  infants: 'Infants',
};

const buildPriceBreakdown = (adultPrice, passengers) => {
  const items = Object.entries(passengers)
    .filter(([, count]) => count > 0)
    .map(([category, count]) => {
      const each = Math.round(adultPrice * (categoryMultiplier[category] || 1));
      return {
        category,
        label: categoryLabel[category],
        count,
        each,
        total: each * count,
      };
    });

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  return { items, subtotal };
};

const buildSegmentSummary = ({ itineraryCodes, optionIndex, preferredAircraft }) => {
  const baseSegments = itineraryCodes.slice(0, -1).map((fromCode, index) => {
    const toCode = itineraryCodes[index + 1];
    const fromMetro = metroMap[fromCode];
    const toMetro = metroMap[toCode];
    return {
      segmentIndex: index,
      fromCode,
      toCode,
      fromAirport: fromMetro.airport,
      toAirport: toMetro.airport,
      distanceKm: Math.round(haversineKm(fromMetro, toMetro)),
    };
  });

  const longestSegmentIndex = baseSegments.reduce(
    (maxIndex, segment, index, all) =>
      segment.distanceKm > all[maxIndex].distanceKm ? index : maxIndex,
    0,
  );

  return baseSegments.map((segment, index) => {
    const segmentDemand = estimateRouteDemand({
      fromCode: segment.fromCode,
      toCode: segment.toCode,
      distanceKm: segment.distanceKm,
    });

    const segmentPreferredAircraft =
      preferredAircraft && index === longestSegmentIndex ? preferredAircraft : '';

    const segmentAircraftSlug = recommendAircraftForRoute({
      distanceKm: segment.distanceKm,
      demandProfile: segmentDemand,
      optionIndex,
      preferredAircraft: segmentPreferredAircraft,
    });

    return {
      ...segment,
      aircraftSlug: segmentAircraftSlug,
      aircraftName: fleetMap[segmentAircraftSlug]?.name || 'Aircraft TBD',
    };
  });
};

const generateLegFlights = ({
  leg,
  fromCode,
  toCode,
  date,
  cabin,
  tripType,
  passengers,
  preferredAircraft,
}) => {
  const itineraryCodes = buildItinerary(fromCode, toCode);
  const routeDistance = Math.round(itineraryDistance(itineraryCodes));
  const demandProfile = estimateRouteDemand({
    fromCode,
    toCode,
    distanceKm: routeDistance,
  });

  const frequency = determineFrequency({
    distanceKm: routeDistance,
    fromCode,
    toCode,
    demandProfile,
  });
  const times = frequencyTemplates[frequency] || frequencyTemplates[1];

  return times.map((departureTime, index) => {
    const segments = buildSegmentSummary({
      itineraryCodes,
      optionIndex: index,
      preferredAircraft,
    });
    const segmentAircraftNames = Array.from(new Set(segments.map((segment) => segment.aircraftName)));
    const aircraftName = segmentAircraftNames.length > 1 ? 'Mixed Fleet by Segment' : segmentAircraftNames[0];
    const aircraftSlug = segments[0]?.aircraftSlug || 'a320neo';

    const departureOffset = getMetroUtcOffsetHours(itineraryCodes[0]);
    const arrivalOffset = getMetroUtcOffsetHours(itineraryCodes[itineraryCodes.length - 1]);
    const depUtc = parseDateTimeToUtc(date, departureTime, departureOffset);
    const tripMinutes = computeTripMinutes(routeDistance, itineraryCodes);
    const arrUtc = addMinutes(depUtc, tripMinutes);
    const flightNumber = generateFlightNumber({
      routeKey: `${itineraryCodes.join('-')}`,
      date,
      cabin,
      tripType,
      leg,
      index,
    });

    const adultPrice = randomPrice({
      distanceKm: routeDistance,
      cabin,
      demandProfile,
      isNightFlight: Number(departureTime.split(':')[0]) >= 20,
    });

    const pricing = buildPriceBreakdown(adultPrice, passengers);

    return {
      id: `${leg}-${flightNumber}-${index}`,
      leg,
      flightNumber,
      aircraftSlug,
      aircraftName,
      segmentAircraftNames,
      itineraryCodes,
      itineraryLine: itineraryLabel(itineraryCodes),
      segments,
      distanceKm: routeDistance,
      departureTime: formatClockAtOffset(depUtc, departureOffset),
      arrivalTime: formatClockAtOffset(arrUtc, arrivalOffset),
      departureTimeZone: formatUtcOffsetLabel(departureOffset),
      arrivalTimeZone: formatUtcOffsetLabel(arrivalOffset),
      dayShift: formatDayShift(depUtc, arrUtc, departureOffset, arrivalOffset),
      duration: formatDuration(tripMinutes),
      departureDate: date,
      cabin,
      pricing,
      subtotal: pricing.subtotal,
    };
  });
};

export const passengerSummary = (passengers) => {
  const ordered = [
    ['adults', 'Adult'],
    ['teens', 'Teen'],
    ['children', 'Child'],
    ['infants', 'Infant'],
  ];

  const text = ordered
    .filter(([key]) => passengers[key] > 0)
    .map(([key, label]) => {
      const count = passengers[key];
      return `${count} ${label}${count > 1 ? 's' : ''}`;
    });

  return text.length ? text.join(', ') : '1 Adult';
};

export const validateSearchInput = ({ fromCode, toCode, departureDate, tripType, returnDate }) => {
  if (!fromCode || !toCode) {
    return 'Select both origin and destination metros.';
  }

  if (fromCode === toCode) {
    return 'Origin and destination must be different.';
  }

  if (!departureDate) {
    return 'Choose a departure date.';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const departure = new Date(`${departureDate}T00:00:00`);
  if (departure < today) {
    return 'Departure date cannot be in the past.';
  }

  if (tripType === 'Round-trip') {
    if (!returnDate) {
      return 'Choose a return date for round-trip search.';
    }
    const ret = new Date(`${returnDate}T00:00:00`);
    if (ret < departure) {
      return 'Return date cannot be before departure date.';
    }
  }

  return null;
};

export const generateSearchResults = (searchState) => {
  const outboundOptions = generateLegFlights({
    leg: 'outbound',
    fromCode: searchState.fromCode,
    toCode: searchState.toCode,
    date: searchState.departureDate,
    cabin: searchState.cabin,
    tripType: searchState.tripType,
    passengers: searchState.passengers,
    preferredAircraft: searchState.preferredAircraft,
  });

  const returnOptions =
    searchState.tripType === 'Round-trip'
      ? generateLegFlights({
          leg: 'return',
          fromCode: searchState.toCode,
          toCode: searchState.fromCode,
          date: searchState.returnDate,
          cabin: searchState.cabin,
          tripType: searchState.tripType,
          passengers: searchState.passengers,
          preferredAircraft: searchState.preferredAircraft,
        })
      : [];

  return {
    outboundOptions,
    returnOptions,
  };
};
