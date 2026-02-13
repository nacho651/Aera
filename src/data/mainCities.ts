import { cityImageBySlug } from './imageAssets';

export type MainCity = {
  slug: string;
  name: string;
  metroCode: string;
  airportCode: string;
  country: string;
  region: 'Americas' | 'Europe' | 'Middle East' | 'Asia-Pacific';
  heroImage: string;
  description: string;
  keyFacts: string[];
  featuredRoutes: string[];
  aircraftTypesCommonlyUsed: string[];
  airportDescription: string;
  loungeInfo: string;
  tagline: string;
  positioningLine: string;
  airportName: string;
  hubType: 'Primary hub' | 'Major hub' | 'Secondary gateway' | 'Gateway';
  terminalInfo: string;
};

export const mainCities: MainCity[] = [
  {
    slug: 'buenos-aires',
    name: 'Buenos Aires',
    metroCode: 'BUE',
    airportCode: 'EZE',
    country: 'AR',
    region: 'Americas',
    heroImage: cityImageBySlug['buenos-aires'],
    description:
      'Buenos Aires anchors AERA in South America with a gateway that balances scale, culture, and commercial reach. The city links regional demand with long-haul business and leisure flows across Europe, North America, and beyond.\n\nEzeiza functions as our South American backbone, feeding premium intercontinental departures while keeping short-haul connections tight and reliable. Operations are designed around smooth transfers, evening bank departures, and resilient daytime regional waves.\n\nFor travelers, Buenos Aires combines cosmopolitan energy with easy onward access to the continent. For the network, it is the strategic launch point for high-value west-east and north-south traffic.',
    keyFacts: [
      'Metro population above 15 million',
      'Timezone: UTC-3',
      'AERA South American primary hub',
      'Dual wave banks for regional and long-haul connectivity',
      'Premium lounge and fast-track lanes at EZE',
      'Strong cargo uplift on Europe rotations',
    ],
    featuredRoutes: ['MAD', 'PAR', 'NYC', 'MIA', 'SIN', 'DXB'],
    aircraftTypesCommonlyUsed: ['a320neo', 'a321xlr', 'b787', 'a350xwb'],
    airportDescription:
      'Ministro Pistarini International Airport (EZE) is AERA\'s primary South American hub, designed for regional feed and long-haul departures in coordinated connection banks.',
    loungeInfo:
      'The AERA Signature Lounge at EZE offers full dining, private work suites, shower rooms, and dedicated transfer support for Premium Economy, Business, and First guests.',
    tagline: 'AERA\'s South American command center at EZE.',
    positioningLine: 'AERA\'s South American Primary Hub',
    airportName: 'Ministro Pistarini International Airport',
    hubType: 'Primary hub',
    terminalInfo: 'Primary operations in International Terminal A with dedicated premium check-in and priority security.',
  },
  {
    slug: 'new-york',
    name: 'New York',
    metroCode: 'NYC',
    airportCode: 'JFK',
    country: 'US',
    region: 'Americas',
    heroImage: cityImageBySlug['new-york'],
    description:
      'New York gives AERA a high-yield foothold in North America and a direct link to the world\'s largest premium travel market. The city supports year-round business traffic while remaining a top long-haul leisure origin.\n\nAt JFK, AERA operates a structured schedule that aligns transatlantic and transpacific departures with seamless regional feed. Our operations focus on reliability through demand peaks, with widebody utilization prioritized on trunk sectors.\n\nFor customers, New York represents pace and optionality. For AERA, it is a cornerstone hub connecting the Americas with Europe, the Middle East, and Asia-Pacific.',
    keyFacts: [
      'Metro population above 19 million',
      'Timezone: UTC-5 / UTC-4 DST',
      'AERA major North American hub',
      'High premium cabin demand on transatlantic sectors',
      'Multi-wave schedule for global connections',
    ],
    featuredRoutes: ['LON', 'PAR', 'DXB', 'SIN', 'BUE', 'MIA'],
    aircraftTypesCommonlyUsed: ['a321xlr', 'b787', 'a350xwb', 'b777x'],
    airportDescription:
      'John F. Kennedy International Airport (JFK) is AERA\'s major North American hub and key long-haul gateway across the Atlantic and Pacific.',
    loungeInfo:
      'The AERA Metropolitan Lounge at JFK includes all-day dining, premium showers, wellness pods, and direct boarding access for top-tier cabins.',
    tagline: 'Global demand meets premium long-haul execution.',
    positioningLine: 'AERA\'s Major North American Hub',
    airportName: 'John F. Kennedy International Airport',
    hubType: 'Major hub',
    terminalInfo: 'Primary departures from Terminal 8 partner gates with integrated premium check-in and fast-track security.',
  },
  {
    slug: 'singapore',
    name: 'Singapore',
    metroCode: 'SIN',
    airportCode: 'SIN',
    country: 'SG',
    region: 'Asia-Pacific',
    heroImage: cityImageBySlug.singapore,
    description:
      'Singapore is one of AERA\'s most efficient hubs, combining geographic advantage with world-class airport infrastructure. It serves as a natural transfer point between Asia-Pacific, Europe, and the Middle East.\n\nAt Changi, AERA deploys high-frequency premium long-haul operations supported by rapid transfer performance and digital wayfinding. The schedule is tuned for both business day returns and red-eye long-haul banks.\n\nAs a gateway city, Singapore reflects the AERA brand at its sharpest: modern, calm, and globally connected.',
    keyFacts: [
      'City-state with high international transfer demand',
      'Timezone: UTC+8',
      'AERA Asia-Pacific hub',
      'Top-tier on-time performance corridor',
      'Strong premium demand to Europe and Middle East',
    ],
    featuredRoutes: ['LON', 'PAR', 'DXB', 'TYO', 'SYD', 'NYC'],
    aircraftTypesCommonlyUsed: ['a321xlr', 'b787', 'a350xwb', 'b777x'],
    airportDescription:
      'Singapore Changi Airport (SIN) functions as AERA\'s Asia-Pacific hub with high-quality transfer infrastructure and long-haul premium readiness.',
    loungeInfo:
      'AERA Horizon Lounge at SIN includes chef stations, nap suites, meeting pods, and dedicated First cabin chauffeur transfer desks.',
    tagline: 'A precision hub linking Asia-Pacific to the world.',
    positioningLine: 'AERA\'s Asia-Pacific Hub',
    airportName: 'Singapore Changi Airport',
    hubType: 'Major hub',
    terminalInfo: 'Core operations in Terminal 3 with premium transfer corridor and direct lounge-to-gate access for select flights.',
  },
  {
    slug: 'london',
    name: 'London',
    metroCode: 'LON',
    airportCode: 'LHR',
    country: 'GB',
    region: 'Europe',
    heroImage: cityImageBySlug.london,
    description:
      'London is AERA\'s principal European anchor and one of our highest-yield premium markets. The city combines deep corporate demand with consistent long-haul leisure volume year-round.\n\nHeathrow operations are structured for broad connectivity to the Americas, Middle East, and Asia-Pacific, with high-capacity widebody deployment on trunk routes. Our schedule favors both same-day business utility and overnight long-haul convenience.\n\nLondon represents scale, network depth, and strategic relevance, making it central to AERA\'s global growth plan.',
    keyFacts: [
      'Metro population above 14 million',
      'Timezone: UTC+0 / UTC+1 DST',
      'AERA major European hub',
      'Strong premium and connecting traffic profile',
      'Heavy widebody deployment on intercontinental routes',
    ],
    featuredRoutes: ['NYC', 'SIN', 'DXB', 'BUE', 'PAR', 'TYO'],
    aircraftTypesCommonlyUsed: ['a321xlr', 'b787', 'a350xwb', 'b777x'],
    airportDescription:
      'London Heathrow Airport (LHR) is AERA\'s major European hub and a key intercontinental transfer platform connecting westbound and eastbound banks.',
    loungeInfo:
      'AERA Crown Lounge at LHR offers private dining, quiet suites, spa rooms, and fast-track immigration coordination for premium guests.',
    tagline: 'AERA\'s primary bridge between Europe and long-haul demand.',
    positioningLine: 'AERA\'s European Gateway Hub',
    airportName: 'London Heathrow Airport',
    hubType: 'Major hub',
    terminalInfo: 'Main operations from Terminal 2 partner concourses with premium curbside drop and dedicated First check-in.',
  },
  {
    slug: 'paris',
    name: 'Paris',
    metroCode: 'PAR',
    airportCode: 'CDG',
    country: 'FR',
    region: 'Europe',
    heroImage: cityImageBySlug.paris,
    description:
      'Paris complements AERA\'s European network as a premium gateway with strong long-haul origin demand and balanced year-round traffic. The city is critical for transatlantic and Asia-bound rotations.\n\nAt Charles de Gaulle, AERA operates focused long-haul banks and selective regional feed, optimizing transfer quality rather than pure volume. This keeps premium product consistency high while preserving schedule resilience.\n\nParis is where AERA combines brand presence, network selectivity, and premium customer experience in one of Europe\'s most iconic markets.',
    keyFacts: [
      'Metro population above 11 million',
      'Timezone: UTC+1 / UTC+2 DST',
      'AERA secondary European gateway',
      'Premium-heavy long-haul demand profile',
      'Focused hub bank structure for quality connections',
    ],
    featuredRoutes: ['NYC', 'SIN', 'DXB', 'BUE', 'MAD'],
    aircraftTypesCommonlyUsed: ['a321xlr', 'b787', 'a350xwb'],
    airportDescription:
      'Paris Charles de Gaulle Airport (CDG) serves as AERA\'s secondary European gateway with premium long-haul emphasis and selective onward feed.',
    loungeInfo:
      'The AERA Atelier Lounge at CDG features regional cuisine, private business booths, and priority transfer service for premium cabins.',
    tagline: 'A premium-focused European gateway at CDG.',
    positioningLine: 'AERA\'s Secondary European Gateway',
    airportName: 'Paris Charles de Gaulle Airport',
    hubType: 'Secondary gateway',
    terminalInfo: 'Most flights depart from Terminal 2 with dedicated transfer desks and premium security channel.',
  },
  {
    slug: 'dubai',
    name: 'Dubai',
    metroCode: 'DXB',
    airportCode: 'DXB',
    country: 'AE',
    region: 'Middle East',
    heroImage: cityImageBySlug.dubai,
    description:
      'Dubai is a strategic east-west hinge in the AERA network, connecting Europe, the Americas, Asia-Pacific, and regional Middle East demand in one coordinated hub.\n\nDubai International enables high-utilization widebody operations with strong transfer throughput, especially on overnight waves. AERA uses DXB to bridge long-haul corridors that benefit from balanced schedule banks and premium service continuity.\n\nFor travelers, Dubai adds flexibility and product consistency across long journeys. For AERA, it is the Middle East engine for growth and network reach.',
    keyFacts: [
      'Major global transfer market',
      'Timezone: UTC+4',
      'AERA Middle East hub',
      'Strong overnight connection banks',
      'High premium traffic on Europe-Asia flows',
      'Widebody-led schedule design',
    ],
    featuredRoutes: ['LON', 'PAR', 'SIN', 'TYO', 'NYC', 'BUE'],
    aircraftTypesCommonlyUsed: ['a321xlr', 'b787', 'a350xwb', 'b777x'],
    airportDescription:
      'Dubai International Airport (DXB) is AERA\'s Middle East hub, engineered for long-haul connectivity and high-quality transfer operations.',
    loungeInfo:
      'AERA Desert Sky Lounge at DXB provides private rest suites, elevated dining, and dedicated transfer hosts for Business and First travelers.',
    tagline: 'AERA\'s east-west connector at DXB.',
    positioningLine: 'AERA\'s Middle East Hub',
    airportName: 'Dubai International Airport',
    hubType: 'Major hub',
    terminalInfo: 'Core operations from Concourse D with premium immigration assistance and priority transfer channels.',
  },
  {
    slug: 'tokyo-haneda',
    name: 'Tokyo (Haneda)',
    metroCode: 'TYO',
    airportCode: 'HND',
    country: 'JP',
    region: 'Asia-Pacific',
    heroImage: cityImageBySlug['tokyo-haneda'],
    description:
      'Tokyo is a flagship market for AERA in Japan, with Haneda providing premium access to the city and strong connectivity across the wider region. Demand is driven by business travel, technology corridors, and high-value leisure segments.\n\nAERA positions Haneda as a gateway with carefully timed departures to Southeast Asia, Europe, and North America. Operations prioritize punctuality and customer flow through premium check-in and efficient transfer handling.\n\nTokyo strengthens AERA\'s Asia-Pacific footprint by pairing disciplined operations with one of the world\'s most quality-focused traveler markets.',
    keyFacts: [
      'Metro population above 37 million',
      'Timezone: UTC+9',
      'AERA Japan gateway at Haneda',
      'High punctuality operating environment',
      'Premium demand led by corporate and tech sectors',
    ],
    featuredRoutes: ['SIN', 'LON', 'DXB', 'PAR', 'NYC'],
    aircraftTypesCommonlyUsed: ['a321xlr', 'b787', 'a350xwb', 'b777x'],
    airportDescription:
      'Tokyo Haneda Airport (HND) is AERA\'s Japan gateway, focused on premium access, punctual operations, and strategic long-haul growth.',
    loungeInfo:
      'AERA Haneda Lounge includes Japanese and international dining zones, shower suites, and fast-track support for premium and elite travelers.',
    tagline: 'Japan gateway service with premium city access.',
    positioningLine: 'AERA\'s Japan Gateway',
    airportName: 'Tokyo Haneda Airport',
    hubType: 'Gateway',
    terminalInfo: 'International departures primarily via Terminal 3 with streamlined premium check-in and priority baggage handling.',
  },
];

export const mainCityBySlug = Object.fromEntries(mainCities.map((city) => [city.slug, city]));

export const mainCityByMetroCode = Object.fromEntries(
  mainCities.map((city) => [city.metroCode, city]),
);

export const mainCityByAirportCode = Object.fromEntries(
  mainCities.map((city) => [city.airportCode, city]),
);
