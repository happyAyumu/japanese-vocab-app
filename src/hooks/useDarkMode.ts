import { useEffect, useState } from "react";
import { loadDarkMode, saveDarkMode } from "../lib/repository";

export function useDarkMode() {
  const [dark, setDark] = useState(() => loadDarkMode());

  useEffect(() => {
    saveDarkMode(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return { dark, toggleDark: () => setDark((d) => !d), setDark };
}
