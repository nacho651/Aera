import { useMemo, useState } from 'react';
import { destinationGroups } from '../data/destinations';
import { haversineKm } from '../lib/flightEngine';
import { metroMap, metroSearchLabel } from '../data/metros';
import './PageStyles.css';

const hubCodes = ['BUE', 'NYC', 'LON', 'DXB', 'SIN'];

const formatDuration = (hours) => {
  const fullHours = Math.floor(hours);
  const minutes = Math.round((hours - fullHours) * 60);
  return `${fullHours}h ${minutes}m`;
};

const estimateDurationFromHub = (fromCode, toCode) => {
  const from = metroMap[fromCode];
  const to = metroMap[toCode];
  const distance = haversineKm(from, to);
  return distance / 840;
};

const DestinationsPage = () => {
  const [region, setRegion] = useState(destinationGroups[0].region);
  const regionData = destinationGroups.find((group) => group.region === region) || destinationGroups[0];
  const [selectedCode, setSelectedCode] = useState(regionData.metros[0]);

  const onRegionChange = (nextRegion) => {
    const group = destinationGroups.find((entry) => entry.region === nextRegion);
    setRegion(nextRegion);
    setSelectedCode(group?.metros[0] || '');
  };

  const selectedMetro = metroMap[selectedCode];

  const hubDurations = useMemo(() => {
    if (!selectedMetro) return [];

    return hubCodes
      .filter((hubCode) => hubCode !== selectedCode)
      .map((hubCode) => ({
        hubCode,
        durationHours: estimateDurationFromHub(hubCode, selectedCode),
      }))
      .sort((a, b) => a.durationHours - b.durationHours)
      .slice(0, 3);
  }, [selectedCode, selectedMetro]);

  return (
    <section className="section">
      <div className="container">
        <div className="page-heading">
          <h1>Destinations</h1>
          <p>Explore AERA destinations by region and review hub-based travel time estimates.</p>
        </div>

        <div className="destination-tabs" role="tablist" aria-label="Destination regions">
          {destinationGroups.map((group) => (
            <button
              type="button"
              key={group.region}
              className={`tab-btn${group.region === region ? ' active' : ''}`}
              onClick={() => onRegionChange(group.region)}
            >
              {group.region}
            </button>
          ))}
        </div>

        <div className="destination-layout">
          <div className="surface-card destination-list">
            {regionData.metros.map((code) => (
              <button
                key={code}
                type="button"
                className={`destination-item${selectedCode === code ? ' active' : ''}`}
                onClick={() => setSelectedCode(code)}
              >
                {metroSearchLabel(code)}
              </button>
            ))}
          </div>

          <article className="surface-card destination-detail">
            {selectedMetro ? (
              <>
                <h3>{metroSearchLabel(selectedCode)}</h3>
                <p>
                  Metro code: <strong>{selectedMetro.code}</strong>
                </p>
                <p>
                  Primary airport: <strong>{selectedMetro.airport}</strong>
                </p>
                <p>
                  Region: <strong>{selectedMetro.region}</strong>
                </p>

                <h4>Approximate flight duration from major hubs</h4>
                <div className="duration-grid">
                  {hubDurations.map((item) => (
                    <div key={item.hubCode} className="duration-chip">
                      <p>
                        {metroMap[item.hubCode].city} ({metroMap[item.hubCode].airport})
                      </p>
                      <span>{formatDuration(item.durationHours)}</span>
                    </div>
                  ))}
                </div>

                <div className="map-placeholder" aria-hidden="true">
                  <div className="map-glow" />
                  <p>Route map preview placeholder</p>
                </div>
              </>
            ) : null}
          </article>
        </div>
      </div>
    </section>
  );
};

export default DestinationsPage;
