import styles from "./CityList.module.css";

export default function CityList({
  accentInactive = false,
  cities = [],
  isClickable = false,
  onCityClick,
  onCitySelect = () => {},
  selectedCity,
}) {
  return (
    <ul className={styles.cityList} typo="h2">
      {cities.map((city) => (
        <li
          className={[
            styles.cityEntry,
            styles.cityEntryHoverable,
            isClickable ? styles.cityEntryClickable : "",
            accentInactive && selectedCity && selectedCity._id !== city._id ? styles.cityEntryInactive : "",
            selectedCity?._id === city._id ? styles.cityEntrySelected : "",
          ]
            .filter(Boolean)
            .join(" ")}
          key={city._id || city.name}
          onClick={onCityClick ? () => onCityClick(city) : undefined}
          onFocus={isClickable ? () => onCitySelect(city) : undefined}
          onMouseEnter={() => onCitySelect(city)}
          tabIndex={isClickable ? 0 : undefined}
        >
          {city.name}
        </li>
      ))}
    </ul>
  );
}
