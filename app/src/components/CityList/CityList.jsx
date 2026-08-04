import styles from "./CityList.module.css";

export default function CityList({
  accentInactive = false,
  cities = [],
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
            onCityClick ? styles.cityEntryClickable : "",
            accentInactive && selectedCity && selectedCity._id !== city._id ? styles.cityEntryInactive : "",
            selectedCity?._id === city._id ? styles.cityEntrySelected : "",
          ]
            .filter(Boolean)
            .join(" ")}
          key={city._id || city.name}
          onClick={onCityClick ? () => onCityClick(city) : undefined}
          onFocus={() => onCitySelect(city)}
          onMouseEnter={() => onCitySelect(city)}
          tabIndex={0}
        >
          {city.name}
        </li>
      ))}
    </ul>
  );
}
