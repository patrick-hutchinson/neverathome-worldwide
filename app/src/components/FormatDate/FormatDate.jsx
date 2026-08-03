const FormatDate = ({ date, className }) => {
  const d = new Date(date);
  const options = { month: "short", year: "numeric" };
  const monthYear = d.toLocaleDateString("en-US", options);

  function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  const day = getOrdinal(d.getDate());

  return <time className={className}>{`${monthYear.split(" ")[0]} ${day}, ${d.getFullYear()}`}</time>;
};

export default FormatDate;
