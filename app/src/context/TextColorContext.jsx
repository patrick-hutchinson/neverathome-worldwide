import { createContext, useContext } from "react";

export const TextColorContext = createContext([]);

export function useTextColorPalette() {
  return useContext(TextColorContext);
}
