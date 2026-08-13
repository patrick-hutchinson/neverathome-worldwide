import { useState } from "react";

import ApplicationSubmission from "@/components/ApplicationSubmission/ApplicationSubmission";
import styles from "./ApplicationForm.module.scss";

const personalFields = [
  { name: "firstName", label: "First Name" },
  { name: "lastName", label: "Last Name" },
  { name: "email", label: "Email", type: "email", span: "full" },
  { name: "phoneNumber", label: "Phone Number", type: "tel", span: "full" },
  { name: "streetAddress", label: "Street Address" },
  { name: "postalCode", label: "Postal Code" },
  { name: "city", label: "City" },
  { name: "country", label: "Country" },
  { name: "website", label: "Website", type: "url", optional: true },
  { name: "instagram", label: "Instagram", optional: true },
];

const quarters = [
  { value: "q1", label: "1" },
  { value: "q2", label: "2" },
  { value: "q3", label: "3" },
  { value: "q4", label: "4 Quartal 2027" },
];

const uploadFields = [
  {
    name: "portfolio",
    label: "Portfolio",
    note: "incl. CV (PDF, max 10 pages, max. 15 MB)",
  },
  {
    name: "projectProposalUpload",
    label: "Project Proposal",
    note: "incl. Budget (PDF, max 5 pages, max. 15 MB)",
  },
  {
    name: "artistPortrait",
    label: "Artist Portrait",
    note: "(high-resolution JPG, max. 5 MB)",
    help: "The image will only be used and published if your application is selected.",
  },
];

function toggleValue(values, value) {
  return values.includes(value) ? values.filter((currentValue) => currentValue !== value) : [...values, value];
}

function resizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

const ApplicationForm = ({ destinations = [], page = {} }) => {
  const [preferredDestination, setPreferredDestination] = useState("");
  const [alternativeDestinations, setAlternativeDestinations] = useState([]);
  const [selectedQuarters, setSelectedQuarters] = useState([]);

  const handlePreferredDestinationChange = (destinationId) => {
    setPreferredDestination(destinationId);
    setAlternativeDestinations((currentDestinations) =>
      currentDestinations.filter((currentDestinationId) => currentDestinationId !== destinationId),
    );
  };

  const handleTextareaInput = (event) => {
    resizeTextarea(event.currentTarget);
  };

  return (
    <form className={styles.form} onSubmit={(event) => event.preventDefault()} typo="h4">
      <fieldset className={`${styles.fieldset} ${styles.personalInformation}`}>
        <legend className={styles.legend} typo="h4">
          Personal Information
        </legend>

        <div className={styles.personalGrid}>
          {personalFields.map((field) => (
            <label
              className={[styles.inputField, field.span === "full" ? styles.inputFieldFull : ""].filter(Boolean).join(" ")}
              key={field.name}
            >
              <span className={styles.visuallyHidden}>{field.label}</span>
              <input autoComplete={field.name} name={field.name} placeholder={field.label} type={field.type || "text"} />
              {field.optional ? (
                <span className={styles.fieldNote} typo="h6">
                  Optional
                </span>
              ) : null}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.destinationGrid}>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend} typo="h4">
            Preferred Destination
          </legend>
          <div className={styles.destinationList} typo="h3">
            {destinations.map((destination) => (
              <label className={styles.choice} key={destination._id}>
                <input
                  checked={preferredDestination === destination._id}
                  name="preferredDestination"
                  onChange={() => handlePreferredDestinationChange(destination._id)}
                  type="radio"
                  value={destination._id}
                />
                <span>{destination.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legendRow} typo="h4">
            <span>Alternative</span>
            <span className={styles.legendNote} typo="h6">
              One Or Multiple
            </span>
          </legend>
          <div className={styles.destinationList} typo="h3">
            {destinations.map((destination) => {
              const isDisabled = preferredDestination === destination._id;

              return (
                <label
                  className={[styles.choice, isDisabled ? styles.choiceDisabled : ""].filter(Boolean).join(" ")}
                  key={destination._id}
                >
                  <input
                    checked={alternativeDestinations.includes(destination._id)}
                    disabled={isDisabled}
                    name="alternativeDestinations"
                    onChange={() =>
                      setAlternativeDestinations((currentDestinations) => toggleValue(currentDestinations, destination._id))
                    }
                    type="checkbox"
                    value={destination._id}
                  />
                  <span>{destination.name}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      <fieldset className={`${styles.fieldset} ${styles.timeFrame}`}>
        <legend className={styles.legendRow} typo="h4">
          <span>Preferred time frame</span>
          <span className={styles.legendNote} typo="h6">
            One Or Multiple Presentation Periods
          </span>
        </legend>
        <div className={styles.quarterList} typo="h3">
          {quarters.map((quarter, index) => (
            <label className={styles.quarterChoice} key={quarter.value}>
              <input
                checked={selectedQuarters.includes(quarter.value)}
                name="quarters"
                onChange={() => setSelectedQuarters((currentQuarters) => toggleValue(currentQuarters, quarter.value))}
                type="checkbox"
                value={quarter.value}
              />
              <span>
                {quarter.label}
                {index < quarters.length - 1 ? " /" : ""}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className={styles.textareaField}>
        <span className={styles.legend} typo="h4">
          Project Proposal
        </span>
        <textarea
          maxLength={1000}
          name="projectProposal"
          onInput={handleTextareaInput}
          placeholder="(max. 1,000 characters)"
        />
      </label>

      <label className={styles.textareaField}>
        <span className={styles.legend} typo="h4">
          Short Biography
        </span>
        <textarea
          maxLength={1000}
          name="shortBiography"
          onInput={handleTextareaInput}
          placeholder="(max. 1,000 characters)"
        />
      </label>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend} typo="h4">
          Uploads
        </legend>
        <div className={styles.uploads}>
          {uploadFields.map((field) => (
            <label className={styles.uploadField} key={field.name}>
              <span>
                {field.label} <span className={styles.muted}>{field.note}</span>
              </span>
              {field.help ? (
                <span className={styles.uploadHelp} typo="h6">
                  {field.help}
                </span>
              ) : null}
              <span className={styles.uploadAction} typo="h6">
                Upload
              </span>
              <input name={field.name} type="file" />
            </label>
          ))}
        </div>
      </fieldset>

      <ApplicationSubmission page={page} />
    </form>
  );
};

export default ApplicationForm;
