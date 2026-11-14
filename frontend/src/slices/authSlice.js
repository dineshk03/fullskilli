import { createSlice } from "@reduxjs/toolkit";

const normalizeToken = (rawToken) => {
  if (!rawToken) return null;
  if (typeof rawToken !== "string") return null;
  let token = rawToken.trim();
  if (token === "null" || token === "undefined") return null;
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    token = token.slice(1, -1);
  }
  return token || null;
};

const initialState = {
  signupData: null,
  loading: false,
  token: normalizeToken(localStorage.getItem("token")),
  user: JSON.parse(localStorage.getItem("user")) || null,
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    setSignupData(state, value) {
      state.signupData = value.payload;
    },
    setLoading(state, value) {
      state.loading = value.payload;
    },
    setToken(state, value) {
      const token = normalizeToken(value.payload);
      state.token = token;
      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    },
    setUser(state, value) {
      state.user = value.payload;
      localStorage.setItem("user", JSON.stringify(value.payload));
    },
    clearAuth(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});

export const { setSignupData, setLoading, setToken, setUser, clearAuth } = authSlice.actions;

export default authSlice.reducer;