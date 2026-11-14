import { ThemeContext } from "./themeContextState";
import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { getPublicSiteSettings } from "../services/operations/siteSettingsAPI";
const THEME_STORAGE_KEY = "theme";
const resolveTheme = mode => {
  if (mode === "dark" || mode === "light") return mode;
  // system
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
};
export const ThemeProvider = ({
  children,
  allowLocalToggle = false
}) => {
  const getInitialMode = () => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
    return "system";
  };

  // mode: light|dark|system (admin-controlled)
  const [themeMode, setThemeMode] = useState(getInitialMode);
  // resolved: light|dark
  const [theme, setTheme] = useState(() => resolveTheme(getInitialMode()));

  // Load global site theme from backend (admin-controlled)
  useEffect(() => {
    let isMounted = true;
    const loadSiteTheme = async () => {
      try {
        const data = await getPublicSiteSettings();
        const mode = data?.theme;
        if (!isMounted) return;
        if (mode === "light" || mode === "dark" || mode === "system") {
          setThemeMode(mode);
        }
      } catch (e) {
        // If backend is unavailable, fall back to local preference
      }
    };
    loadSiteTheme();
    const handler = event => {
      const mode = event?.detail?.theme;
      if (mode === "light" || mode === "dark" || mode === "system") {
        setThemeMode(mode);
      }
    };
    window.addEventListener("siteThemeUpdated", handler);
    return () => {
      isMounted = false;
      window.removeEventListener("siteThemeUpdated", handler);
    };
  }, []);
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    const resolved = resolveTheme(themeMode);
    setTheme(resolved);
  }, [themeMode]);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");else root.classList.remove("dark");
  }, [theme]);
  const value = useMemo(() => {
    const toggleTheme = () => {
      if (!allowLocalToggle) return;
      setThemeMode(prev => {
        const current = prev === "system" ? resolveTheme("system") : prev;
        return current === "dark" ? "light" : "dark";
      });
    };
    return {
      theme,
      themeMode,
      setThemeMode,
      toggleTheme,
      allowLocalToggle
    };
  }, [theme, themeMode, allowLocalToggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
ThemeProvider.propTypes = {
  "children": PropTypes.node,
  "allowLocalToggle": PropTypes.bool
};
