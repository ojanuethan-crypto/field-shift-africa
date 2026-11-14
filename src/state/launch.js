// In-memory flag: false on every fresh page load / app open, true once the splash has played.
// (Deliberately not stored in sessionStorage/localStorage so the logo animation runs on every entry.)
export const launch = { splashDone: false }
