import { useEffect, useRef, useState } from "react";

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
  { value: "q4", label: "4" },
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
const hexColorPattern = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function getTextColorPalette(textColors = []) {
  return (textColors || []).map((color) => color?.hexCode).filter((hexCode) => hexColorPattern.test(hexCode));
}

function getRandomTextColor(textColorPalette = []) {
  if (textColorPalette.length === 0) return null;

  return textColorPalette[Math.floor(Math.random() * textColorPalette.length)];
}

function toggleValue(values, value) {
  return values.includes(value) ? values.filter((currentValue) => currentValue !== value) : [...values, value];
}

function getNextColorMap(currentColorMap, value, textColorPalette) {
  if (currentColorMap[value]) return currentColorMap;

  const nextColor = getRandomTextColor(textColorPalette);
  if (!nextColor) return currentColorMap;

  return {
    ...currentColorMap,
    [value]: nextColor,
  };
}

function resizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

const DestinationScrollList = ({ children }) => {
  const listRef = useRef(null);
  const [edgeState, setEdgeState] = useState({ hasTopFeather: false, hasBottomFeather: false });

  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;

    const updateEdgeState = () => {
      const hasOverflow = list.scrollHeight > list.clientHeight + 1;
      const hasTopFeather = hasOverflow && list.scrollTop > 1;
      const hasBottomFeather = hasOverflow && list.scrollTop + list.clientHeight < list.scrollHeight - 1;

      setEdgeState({ hasTopFeather, hasBottomFeather });
    };

    updateEdgeState();
    list.addEventListener("scroll", updateEdgeState, { passive: true });
    window.addEventListener("resize", updateEdgeState);

    return () => {
      list.removeEventListener("scroll", updateEdgeState);
      window.removeEventListener("resize", updateEdgeState);
    };
  }, [children]);

  return (
    <div
      className={[
        styles.destinationListFrame,
        edgeState.hasTopFeather ? styles.destinationListFrameTop : "",
        edgeState.hasBottomFeather ? styles.destinationListFrameBottom : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.destinationList} ref={listRef} typo="h3">
        {children}
      </div>
    </div>
  );
};

const ApplicationForm = ({ destinations = [], page = {} }) => {
  const textColorPalette = getTextColorPalette(page.textColors);
  const fileInputRefs = useRef({});
  const [preferredDestination, setPreferredDestination] = useState("");
  const [alternativeDestinations, setAlternativeDestinations] = useState([]);
  const [selectedQuarters, setSelectedQuarters] = useState([]);
  const [selectedColorMap, setSelectedColorMap] = useState({});
  const [uploads, setUploads] = useState({});

  useEffect(() => {
    const intervals = [];

    Object.entries(uploads).forEach(([fieldName, upload]) => {
      if (!upload?.fileName || upload.status !== "loading") return;

      const interval = window.setInterval(() => {
        setUploads((currentUploads) => {
          const currentUpload = currentUploads[fieldName];
          if (!currentUpload || currentUpload.status !== "loading") return currentUploads;

          const nextProgress = Math.min(currentUpload.progress + 8, 100);

          return {
            ...currentUploads,
            [fieldName]: {
              ...currentUpload,
              progress: nextProgress,
              status: nextProgress >= 100 ? "complete" : "loading",
            },
          };
        });
      }, 80);

      intervals.push(interval);
    });

    return () => intervals.forEach(window.clearInterval);
  }, [uploads]);

  const handlePreferredDestinationChange = (destinationId) => {
    setPreferredDestination(destinationId);
    setSelectedColorMap((currentColorMap) => getNextColorMap(currentColorMap, destinationId, textColorPalette));
    setAlternativeDestinations((currentDestinations) =>
      currentDestinations.filter((currentDestinationId) => currentDestinationId !== destinationId),
    );
  };

  const handleTextareaInput = (event) => {
    resizeTextarea(event.currentTarget);
  };

  const handleUploadChange = (fieldName, event) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    setUploads((currentUploads) => ({
      ...currentUploads,
      [fieldName]: {
        fileName: file.name,
        progress: 0,
        status: "loading",
      },
    }));
  };

  const handleUploadReset = (fieldName) => {
    if (fileInputRefs.current[fieldName]) {
      fileInputRefs.current[fieldName].value = "";
    }

    setUploads((currentUploads) => {
      const nextUploads = { ...currentUploads };
      delete nextUploads[fieldName];
      return nextUploads;
    });
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
          <DestinationScrollList>
            {destinations.map((destination) => (
              <label
                className={styles.choice}
                key={destination._id}
                style={{ "--form-choice-selected-color": selectedColorMap[destination._id] }}
              >
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
          </DestinationScrollList>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legendRow} typo="h4">
            <span>Alternative</span>
            <span className={styles.legendNote} typo="h6">
              One Or Multiple
            </span>
          </legend>
          <DestinationScrollList>
            {destinations.map((destination) => {
              const isDisabled = preferredDestination === destination._id;

              return (
                <label
                  className={[styles.choice, isDisabled ? styles.choiceDisabled : ""].filter(Boolean).join(" ")}
                  key={destination._id}
                  style={{ "--form-choice-selected-color": selectedColorMap[destination._id] }}
                >
                  <input
                    checked={alternativeDestinations.includes(destination._id)}
                    disabled={isDisabled}
                    name="alternativeDestinations"
                    onChange={() => {
                      setSelectedColorMap((currentColorMap) =>
                        getNextColorMap(currentColorMap, destination._id, textColorPalette),
                      );
                      setAlternativeDestinations((currentDestinations) => toggleValue(currentDestinations, destination._id));
                    }}
                    type="checkbox"
                    value={destination._id}
                  />
                  <span>{destination.name}</span>
                </label>
              );
            })}
          </DestinationScrollList>
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
            <span className={styles.quarterGroup} key={quarter.value}>
              <label
                className={styles.quarterChoice}
                style={{ "--form-choice-selected-color": selectedColorMap[quarter.value] }}
              >
                <input
                  checked={selectedQuarters.includes(quarter.value)}
                  name="quarters"
                  onChange={() => {
                    setSelectedColorMap((currentColorMap) =>
                      getNextColorMap(currentColorMap, quarter.value, textColorPalette),
                    );
                    setSelectedQuarters((currentQuarters) => toggleValue(currentQuarters, quarter.value));
                  }}
                  type="checkbox"
                  value={quarter.value}
                />
                <span>{quarter.label}</span>
              </label>
              {index < quarters.length - 1 ? <span className={styles.quarterSeparator}>/</span> : null}
            </span>
          ))}
          <span className={styles.quarterSuffix}>Quarter 2027</span>
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
          {uploadFields.map((field) => {
            const upload = uploads[field.name];
            const isUploading = upload?.status === "loading";
            const isComplete = upload?.status === "complete";

            return (
              <div
                className={[
                  styles.uploadField,
                  upload ? styles.uploadFieldActive : "",
                  isComplete ? styles.uploadFieldComplete : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={field.name}
                onClick={() => fileInputRefs.current[field.name]?.click()}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  fileInputRefs.current[field.name]?.click();
                }}
                role="button"
                tabIndex={0}
              >
                <span className={styles.uploadTitle}>
                  <span className={styles.uploadTitleText} style={{ "--upload-progress": `${upload?.progress || 0}%` }}>
                    {field.label}
                  </span>
                  {!upload ? <span className={styles.muted}> {field.note}</span> : null}
                </span>
              {field.help && !upload ? (
                <span className={styles.uploadHelp} typo="h6">
                  {field.help}
                </span>
              ) : null}
                <span className={styles.uploadMeta} typo="h6">
                  {isComplete ? <span className={styles.uploadFileName}>{upload.fileName}</span> : null}
                  {isUploading ? <span className={styles.uploadStatus}>Uploading</span> : null}
                  <button
                    className={styles.uploadAction}
                    onClick={(event) => {
                      event.stopPropagation();

                      if (isComplete) {
                        handleUploadReset(field.name);
                        return;
                      }

                      fileInputRefs.current[field.name]?.click();
                    }}
                    type="button"
                  >
                    {isComplete ? "Delete" : "Upload"}
                  </button>
                </span>
                <input
                  className={styles.uploadInput}
                  name={field.name}
                  onChange={(event) => handleUploadChange(field.name, event)}
                  ref={(input) => {
                    fileInputRefs.current[field.name] = input;
                  }}
                  type="file"
                />
              </div>
            );
          })}
        </div>
      </fieldset>

      <ApplicationSubmission page={page} textColorPalette={textColorPalette} />
    </form>
  );
};

export default ApplicationForm;
