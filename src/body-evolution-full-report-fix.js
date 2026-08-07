import { supabase } from "./lib/supabase.js";

const reportFields = [
  ["weight_kg", "Peso", "kg"],
  ["height_cm", "Altura", "cm"],
  ["body_fat_pct", "Gordura corporal", "%"],
  ["muscle_mass_kg", "Massa muscular", "kg"],
  ["visceral_fat", "Gordura visceral", ""],
  ["metabolic_age", "Idade metabólica", "anos"],
  ["neck_cm", "Pescoço", "cm"],
  ["shoulders_cm", "Ombros", "cm"],
  ["chest_cm", "Peitoral", "cm"],
  ["waist_cm", "Cintura", "cm"],
  ["abdomen_cm", "Abdômen", "cm"],
  ["hips_cm", "Quadril", "cm"],
  ["arm_left_cm", "Braço esquerdo", "cm"],
  ["arm_right_cm", "Braço direito", "cm"],
  ["thigh_left_cm", "Coxa esquerda", "cm"],
  ["thigh_right_cm", "Coxa direita", "cm"],
  ["calf_left_cm", "Panturrilha esquerda", "cm"],
  ["calf_right_cm", "Panturrilha direita", "cm"],
];

const modalCache = new WeakMap();
let scheduled = false;

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[char],
  );
}

function formatValue(value, unit) {
  if (value === "" || value == null) return "-";
  const numeric = Number(value);
  const formatted = Number.isFinite(numeric)
    ? new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(numeric)
    : String(value);
  return `${formatted}${unit ? ` ${unit}` : ""}`;
}

async function loadRecords(modal, uid, force = false) {
  const cached = modalCache.get(modal);
  if (!force && cached?.uid === uid && cached.records) return cached.records;
  if (!force && cached?.uid === uid && cached.promise) return cached.promise;

  const promise = supabase
    .from("body_progress")
    .select("*")
    .eq("user_id", uid)
    .order("measured_at", { ascending: false })
    .then(({ data, error }) => {
      if (error) throw error;
      const records = new Map(
        (data || []).map((record) => [String(record.id), record]),
      );
      modalCache.set(modal, { uid, records });
      return records;
    })
    .catch((error) => {
      modalCache.delete(modal);
      throw error;
    });

  modalCache.set(modal, { uid, promise });
  return promise;
}

function renderFullReport(entry, record) {
  const grid = entry.querySelector(".be-entry-grid");
  if (!grid) return;

  grid.innerHTML = reportFields
    .map(
      ([key, label, unit]) =>
        `<span><b>${escapeHtml(label)}:</b> ${escapeHtml(formatValue(record[key], unit))}</span>`,
    )
    .join("");
  entry.dataset.fullReportReady = "true";
}

async function enhanceModal(modal) {
  const uid = modal.dataset.evolutionUser;
  if (!uid) return;

  const entries = [...modal.querySelectorAll(".be-entry[data-evaluation-id]")];
  const pending = entries.filter(
    (entry) => entry.dataset.fullReportReady !== "true",
  );
  if (!pending.length) return;

  try {
    let records = await loadRecords(modal, uid);
    const hasMissingRecord = pending.some(
      (entry) => !records.has(String(entry.dataset.evaluationId)),
    );
    if (hasMissingRecord) records = await loadRecords(modal, uid, true);

    pending.forEach((entry) => {
      const record = records.get(String(entry.dataset.evaluationId));
      if (record) renderFullReport(entry, record);
    });
  } catch (error) {
    console.error(
      "MaYFiT: não foi possível exibir o relatório corporal completo.",
      error,
    );
  }
}

function run() {
  scheduled = false;
  document
    .querySelectorAll(".be-modal[data-evolution-user]")
    .forEach((modal) => enhanceModal(modal));
}

function scheduleRun() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(run);
}

const observer = new MutationObserver(scheduleRun);
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["data-evolution-user"],
});

document.addEventListener("mayfit:evolution-saved", scheduleRun);
scheduleRun();
