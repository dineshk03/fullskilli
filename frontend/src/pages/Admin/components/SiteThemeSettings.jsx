import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { getAdminSiteSettings, updateAdminSiteSettings } from "../../../services/operations/siteSettingsAPI";
const SiteThemeSettings = () => {
  const {
    token
  } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState("system");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminSiteSettings(token);
      setTheme(data?.theme || "system");
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    if (token) {
      load();
    }
  }, [load, token]);
  const save = async () => {
    setSaving(true);
    try {
      await updateAdminSiteSettings({
        theme
      }, token);
      window.dispatchEvent(new CustomEvent("siteThemeUpdated", {
        detail: {
          theme
        }
      }));
    } finally {
      setSaving(false);
    }
  };
  return <div className="space-y-6 text-white">
      <div className="bg-richblack-800 border border-richblack-700 rounded-xl p-4 sm:p-6">
        <h2 className="text-xl font-bold text-richblack-5">Site Theme</h2>
        <p className="text-richblack-300 text-sm mt-1">
          This controls Light/Dark mode for the whole website (all users).
        </p>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button type="button" disabled={loading || saving} onClick={() => setTheme("light")} className={`px-4 py-3 rounded-lg border transition-colors text-sm font-medium ${theme === "light" ? "bg-yellow-50 text-richblack-900 border-yellow-50" : "bg-richblack-700 text-richblack-50 border-richblack-600 hover:bg-richblack-600"}`}>
              Light
            </button>
            <button type="button" disabled={loading || saving} onClick={() => setTheme("dark")} className={`px-4 py-3 rounded-lg border transition-colors text-sm font-medium ${theme === "dark" ? "bg-yellow-50 text-richblack-900 border-yellow-50" : "bg-richblack-700 text-richblack-50 border-richblack-600 hover:bg-richblack-600"}`}>
              Dark
            </button>
            <button type="button" disabled={loading || saving} onClick={() => setTheme("system")} className={`px-4 py-3 rounded-lg border transition-colors text-sm font-medium ${theme === "system" ? "bg-yellow-50 text-richblack-900 border-yellow-50" : "bg-richblack-700 text-richblack-50 border-richblack-600 hover:bg-richblack-600"}`}>
              System
            </button>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button type="button" disabled={loading || saving} onClick={load} className="px-4 py-2 rounded-lg bg-richblack-700 hover:bg-richblack-600 border border-richblack-600 text-sm">
              Refresh
            </button>
            <button type="button" disabled={loading || saving} onClick={save} className="px-4 py-2 rounded-lg bg-caribbeangreen-400 hover:bg-caribbeangreen-500 text-richblack-900 text-sm font-medium">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>;
};
export default SiteThemeSettings;
