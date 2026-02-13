import { fleetMap } from '../data/fleet';
import { metroMap } from '../data/metros';

const normalizePair = (fromCode, toCode) => [fromCode, toCode].sort().join('-');

const metroDemandWeights = {
  MVD: 41,
  BUE: 78,
  SAO: 85,
  RIO: 69,
  SCL: 62,
  LIM: 66,
  BOG: 71,
  PTY: 74,
  MIA: 83,
  NYC: 98,
  LAX: 86,
  SFO: 84,
  ORD: 83,
  ATL: 82,
  DFW: 81,
  YYZ: 79,
  MEX: 75,
  LON: 97,
  PAR: 91,
  MAD: 82,
  ROM: 76,
  AMS: 80,
  FRA: 88,
  MUC: 80,
  BER: 74,
  BCN: 83,
  LIS: 73,
  ATH: 70,
  DXB: 95,
  DOH: 87,
  IST: 79,
  JED: 65,
  RUH: 71,
  CAI: 78,
  SIN: 94,
  HKG: 88,
  TYO: 96,
  SYD: 81,
  BKK: 74,
  SEL: 91,
  SHA: 94,
  BJS: 95,
  DEL: 89,
  BOM: 84,
  BLR: 80,
  KUL: 76,
  CGK: 82,
  MNL: 77,
  MEL: 78,
  AKL: 70,
};

const hubTierByMetro = {
  BUE: 'primary',
  NYC: 'major',
  LON: 'major',
  PAR: 'secondary',
  DXB: 'major',
  SIN: 'major',
  TYO: 'secondary',
  SAO: 'major',
  MIA: 'major',
  BOG: 'secondary',
  PTY: 'secondary',
  YYZ: 'secondary',
  ORD: 'secondary',
  ATL: 'secondary',
  SFO: 'secondary',
  MAD: 'secondary',
  DOH: 'secondary',
  LAX: 'major',
  FRA: 'major',
  BCN: 'secondary',
  DEL: 'major',
  BJS: 'major',
  SHA: 'major',
  SEL: 'major',
  SYD: 'secondary',
  MEL: 'secondary',
  KUL: 'secondary',
  CGK: 'secondary',
  IST: 'secondary',
};

const trunkRoutePairs = new Set([
  'BUE-MAD',
  'BUE-PAR',
  'BUE-NYC',
  'DXB-LON',
  'DXB-SIN',
  'LON-NYC',
  'LON-SIN',
  'MIA-SAO',
  'NYC-PAR',
  'PAR-SIN',
  'SIN-TYO',
  'LON-TYO',
  'DEL-LON',
  'DEL-DXB',
  'BJS-SIN',
  'SHA-SIN',
  'NYC-SAO',
  'NYC-LAX',
  'LON-PAR',
  'LON-FRA',
  'PAR-DXB',
]);

const premiumCorridors = new Set([
  'DXB-SIN',
  'LON-NYC',
  'LON-SIN',
  'NYC-PAR',
  'PAR-SIN',
  'SIN-TYO',
  'DEL-LON',
  'PAR-DXB',
  'NYC-SAO',
]);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const hubTierWeight = {
  primary: 9,
  major: 7,
  secondary: 4,
};

const sortedFleetByRange = ['a320neo', 'a321xlr', 'b787', 'a350xwb', 'b777x'];

const canFlyDistance = (slug, distanceKm) => {
  const aircraft = fleetMap[slug];
  return Boolean(aircraft && aircraft.range_km + 500 >= distanceKm);
};

const chooseFromCandidates = (candidates, distanceKm, allowedSet) => {
  const unique = Array.from(new Set(candidates));
  for (const slug of unique) {
    if (allowedSet.has(slug) && canFlyDistance(slug, distanceKm)) {
      return slug;
    }
  }
  return null;
};

export const estimateRouteDemand = ({ fromCode, toCode, distanceKm }) => {
  const fromMetro = metroMap[fromCode];
  const toMetro = metroMap[toCode];

  if (!fromMetro || !toMetro) {
    return {
      score: 55,
      tier: 'medium',
      isHubToHub: false,
      isTrunkRoute: false,
      isIntercontinental: false,
      isPremiumCorridor: false,
      pairKey: normalizePair(fromCode, toCode),
    };
  }

  const pairKey = normalizePair(fromCode, toCode);
  const fromDemand = metroDemandWeights[fromCode] || 58;
  const toDemand = metroDemandWeights[toCode] || 58;

  const fromHubTier = hubTierByMetro[fromCode] || null;
  const toHubTier = hubTierByMetro[toCode] || null;
  const isHubToHub = Boolean(fromHubTier && toHubTier);

  const sameRegion = fromMetro.region === toMetro.region;
  const isIntercontinental = !sameRegion;

  const baseScore = (fromDemand + toDemand) / 2;
  const hubBonus =
    (hubTierWeight[fromHubTier] || 0) +
    (hubTierWeight[toHubTier] || 0) +
    (isHubToHub ? 3 : 0);

  const routeTypeBonus =
    distanceKm >= 10000 ? 8 : distanceKm >= 5500 ? 6 : distanceKm >= 2500 ? 2 : distanceKm <= 900 ? 4 : 0;

  const trunkBonus = trunkRoutePairs.has(pairKey) ? 17 : 0;
  const premiumBonus = premiumCorridors.has(pairKey) ? 7 : 0;
  const intercontinentalBonus = isIntercontinental ? 5 : 0;
  const longThinPenalty = !isHubToHub && distanceKm > 6000 ? -9 : 0;

  const score = clamp(
    Math.round(
      baseScore +
        hubBonus +
        routeTypeBonus +
        trunkBonus +
        premiumBonus +
        intercontinentalBonus +
        longThinPenalty,
    ),
    24,
    99,
  );

  const tier = score >= 86 ? 'very-high' : score >= 72 ? 'high' : score >= 58 ? 'medium' : 'low';

  return {
    score,
    tier,
    isHubToHub,
    isTrunkRoute: trunkRoutePairs.has(pairKey),
    isIntercontinental,
    isPremiumCorridor: premiumCorridors.has(pairKey),
    pairKey,
  };
};

export const recommendAircraftForRoute = ({
  distanceKm,
  demandProfile,
  optionIndex = 0,
  preferredAircraft = '',
  allowedAircraftSlugs = null,
}) => {
  const allowedSlugs = Array.isArray(allowedAircraftSlugs)
    ? allowedAircraftSlugs.filter((slug) => fleetMap[slug])
    : sortedFleetByRange;

  const allowedSet = new Set(allowedSlugs.length ? allowedSlugs : sortedFleetByRange);

  if (preferredAircraft && optionIndex === 0 && allowedSet.has(preferredAircraft)) {
    if (canFlyDistance(preferredAircraft, distanceKm)) {
      return preferredAircraft;
    }
  }

  const tier = demandProfile?.tier || 'medium';
  const isHubToHub = Boolean(demandProfile?.isHubToHub);
  const isTrunkRoute = Boolean(demandProfile?.isTrunkRoute);

  let candidates;

  if (distanceKm > 14500) {
    candidates = ['b777x', 'a350xwb', 'b787'];
  } else if (distanceKm >= 11500) {
    candidates = tier === 'very-high' ? ['b777x', 'a350xwb', 'b787'] : ['a350xwb', 'b787', 'b777x'];
  } else if (distanceKm >= 8500) {
    if (tier === 'very-high' || isTrunkRoute || isHubToHub) {
      candidates = ['a350xwb', 'b787', 'b777x'];
    } else {
      candidates = ['b787', 'a350xwb', 'a321xlr'];
    }
  } else if (distanceKm >= 5500) {
    if (isHubToHub || tier === 'very-high' || tier === 'high') {
      candidates = ['b787', 'a350xwb', 'a321xlr'];
    } else if (tier === 'medium') {
      candidates = ['b787', 'a321xlr', 'a350xwb'];
    } else {
      candidates = ['a321xlr', 'b787', 'a350xwb'];
    }
  } else if (distanceKm >= 3500) {
    if (isHubToHub && (tier === 'very-high' || tier === 'high')) {
      candidates = ['b787', 'a321xlr', 'a350xwb'];
    } else if (tier === 'high') {
      candidates = ['b787', 'a321xlr', 'a350xwb'];
    } else {
      candidates = ['a321xlr', 'b787', 'a320neo'];
    }
  } else if (distanceKm >= 2500) {
    if (tier === 'very-high') {
      candidates = ['b787', 'a321xlr', 'a320neo'];
    } else {
      candidates = ['a321xlr', 'a320neo', 'b787'];
    }
  } else if (distanceKm >= 1400) {
    candidates = tier === 'very-high' ? ['a321xlr', 'a320neo', 'b787'] : ['a320neo', 'a321xlr'];
  } else {
    candidates = ['a320neo', 'a321xlr'];
  }

  const rotated = optionIndex > 0 ? [...candidates.slice(1), candidates[0]] : candidates;

  const selected = chooseFromCandidates(rotated, distanceKm, allowedSet);
  if (selected) return selected;

  for (const slug of sortedFleetByRange) {
    if (allowedSet.has(slug) && canFlyDistance(slug, distanceKm)) {
      return slug;
    }
  }

  return allowedSlugs[0] || 'a320neo';
};
