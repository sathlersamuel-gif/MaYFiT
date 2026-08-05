const STORE = "mayfit_v8";
const LEGACY_KEYS = [
  "mayfit_workout_data_dirty",
  "mayfit_open_workout_after_sync",
  "mayfit_sync_open_workout",
  "mayfit_workout_changed",
];

function clearLegacyReloadState() {
  LEGACY_KEYS.forEach((key) => sessionStorage.removeItem(key));
  document.getElementById("mayfit-silent-sync-cover")?.remove();
}

clearLegacyReloadState();
window.addEventListener("pageshow", clearLegacyReloadState);
window.addEventListener("storage", (event) => {
  if (event.key === STORE) clearLegacyReloadState();
});
window.addEventListener("mayfit-store-updated", clearLegacyReloadState);
