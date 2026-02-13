import { useEffect, useMemo, useRef, useState } from 'react';
import { metroSearchLabel } from '../data/metros';
import './AutocompleteInput.css';

const normalizeText = (value) => value.trim().toLowerCase();

const AutocompleteInput = ({
  id,
  label,
  value,
  options,
  onTextChange,
  onSelect,
  placeholder = 'Type city or code',
}) => {
  const rootRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const query = normalizeText(value);
    if (!query) return options;

    return options.filter((metro) => {
      const code = metro.code.toLowerCase();
      const city = metro.city.toLowerCase();
      const airport = metro.airport.toLowerCase();
      return code.includes(query) || city.includes(query) || airport.includes(query);
    });
  }, [options, value]);

  const selectOption = (metro) => {
    onSelect(metro);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className="auto-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="field"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          onTextChange(event.target.value);
          setIsOpen(true);
        }}
      />
      {isOpen ? (
        <div className="auto-dropdown" role="listbox">
          {filtered.length ? (
            filtered.slice(0, 12).map((metro) => (
              <button
                key={metro.code}
                type="button"
                className="auto-option"
                onClick={() => selectOption(metro)}
              >
                <span>{metroSearchLabel(metro.code)}</span>
                <small>{metro.airport}</small>
              </button>
            ))
          ) : (
            <p className="auto-empty">No matching metros.</p>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default AutocompleteInput;
