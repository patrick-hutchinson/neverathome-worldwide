import styles from "./CityList.module.css";

export default function CityList({ cities = [], onCitySelect = () => {} }) {
  return (
    <ul className={styles.cityList} typo="h2">
      {cities.map((city) => (
        <li
          className={styles.cityEntry}
          key={city._id || city.name}
          onClick={() => onCitySelect(city)}
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
