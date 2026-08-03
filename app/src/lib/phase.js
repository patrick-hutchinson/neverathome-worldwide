export const phaseLabels = {
  phaseA: "Phase A",
  phaseB: "Phase B",
  phaseC: "Phase C",
};

export function getCurrentPhaseLabel(phase) {
  if (!phase) return null;

  return phaseLabels[phase] || phase;
}
