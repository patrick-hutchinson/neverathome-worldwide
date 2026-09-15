export const applicationUploadFields = [
  {
    name: "portfolio",
    label: "Portfolio",
    maxBytes: 10 * 1024 * 1024,
    allowedContentTypes: ["application/pdf"],
    note: "incl. CV (PDF, max 10 pages, max. 10 MB)",
  },
  {
    name: "projectProposalUpload",
    label: "Project Proposal Summary",
    maxBytes: 5 * 1024 * 1024,
    allowedContentTypes: ["application/pdf"],
    note: "incl. Budget (PDF, max 5 pages, max. 5 MB)",
  },
  {
    name: "artistPortrait",
    label: "Artist Portrait",
    maxBytes: 3 * 1024 * 1024,
    allowedContentTypes: ["image/jpeg"],
    note: "(high-resolution JPG, max. 3 MB)",
    help: "The image will only be used and published if your application is selected.",
  },
];

export const applicationTextareaFields = [
  {
    name: "projectProposal",
    label: "Project Proposal Summary",
    maxLength: 500,
    placeholder: "(max 500 characters incl. spacing)",
  },
  {
    name: "biography",
    label: "Biography",
    maxLength: 500,
    placeholder: "(max 500 characters incl. spacing)",
  },
];

export const applicationDeclarations = [
  "I confirm that my primary place of residence is in Austria.",
  "I confirm that the submitted materials are my own work or that I hold all necessary rights to the submitted content.",
  "I accept the Terms and Conditions of the Open Call.",
  "I agree that my submitted biography, project materials and images may be used by NeverAtHome and the BMEIA for communication and promotional purposes related to the project if my application is selected.",
  "If selected, I agree to participate in the project from 2026-2028, including the final group exhibition in Vienna in 2028, and to cooperate with Never At Home and the BMEIA throughout the project.",
  "I consent to the processing of my personal data in accordance with the Privacy Policy.",
];
