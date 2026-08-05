import { supabase } from "./lib/supabase.js";

const BODY_FIELDS = [
  "weight_kg",
  "height_cm",
  "body_fat_pct",
  "muscle_mass_kg",
  "visceral_fat",
  "metabolic_age",
  "neck_cm",
  "shoulders_cm",
  "chest_cm",
  "waist_cm",
  "abdomen_cm",
  "hips_cm",
  "arm_left_cm",
  "arm_right_cm",
  "thigh_left_cm",
  "thigh_right_cm",
  "calf_left_cm",
  "calf_right_cm",
];
const PHOTO_FIELDS = [
  ["front", "photo_front"],
  ["side", "photo_side"],
  ["back", "photo_back"],
];

function currentUser() {
  try {
    return JSON.parse(sessionStorage.getItem("mayfit_user") || "null");
  } catch {
    return null;
  }
}
function numeric(value) {
  return value === "" || value == null ? null : Number(value);
}
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function setMessage(element, text, type = "normal") {
  if (!element) return;
  element.textContent = text;
  element.style.color =
    type === "success" ? "#8df20b" : type === "error" ? "#ff9d9d" : "#a9b8af";
  element.style.fontWeight = type === "success" ? "900" : "700";
}

async function compressImage(file) {
  if (!file || !file.type?.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 1100;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas
      .getContext("2d", { alpha: false })
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.72),
    );
    return blob
      ? new File([blob], "foto-evolucao.jpg", {
          type: "image/jpeg",
          lastModified: Date.now(),
        })
      : file;
  } catch {
    return file;
  }
}

async function uploadWithRetry(file, uid, kind) {
  if (!file) return null;
  const prepared = await compressImage(file);
  const path = `${uid}/${Date.now()}-${kind}.jpg`;
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const { error } = await supabase.storage
      .from("body-progress")
      .upload(path, prepared, {
        upsert: false,
        contentType: prepared.type || "image/jpeg",
        cacheControl: "31536000",
      });
    if (!error) return path;
    lastError = error;
    if (attempt < 2) await wait(450);
  }
  throw lastError || new Error(`Falha ao enviar a foto ${kind}.`);
}

async function uploadPhotosInBackground(form, userId, recordId, message) {
  const selected = PHOTO_FIELDS.map(([kind, column]) => ({
    kind,
    column,
    file: form.querySelector(`[data-photo="${kind}"]`)?.files?.[0],
  })).filter((item) => item.file);
  if (!selected.length) return;
  setMessage(
    message,
    "Medidas salvas. Enviando fotos em segundo plano...",
    "success",
  );
  const results = await Promise.allSettled(
    selected.map(async (item) => ({
      column: item.column,
      path: await uploadWithRetry(item.file, userId, item.kind),
    })),
  );
  const updates = {};
  let failed = 0;
  results.forEach((result) => {
    if (result.status === "fulfilled")
      updates[result.value.column] = result.value.path;
    else failed++;
  });
  if (Object.keys(updates).length) {
    const { error } = await supabase
      .from("body_progress")
      .update(updates)
      .eq("id", recordId);
    if (error) failed++;
  }
  setMessage(
    message,
    failed
      ? "Medidas salvas. Algumas fotos não foram enviadas."
      : "Avaliação e fotos salvas com sucesso.",
    "success",
  );
  document.dispatchEvent(
    new CustomEvent("mayfit:evolution-saved", { detail: { userId } }),
  );
}

async function handleSave(form) {
  if (form.dataset.fastSaving === "true") return;
  form.dataset.fastSaving = "true";
  const user = currentUser();
  const targetUserId =
    form.closest(".be-modal")?.dataset.evolutionUser ||
    (user?.role === "student" ? user.id : "");
  const button = form.querySelector('button[type="submit"]');
  const message = form.querySelector(".be-msg");
  const original = button?.textContent || "Salvar avaliação";
  try {
    if (!targetUserId)
      throw new Error("Selecione o aluno antes de salvar a avaliação.");
    const fd = new FormData(form);
    const row = {
      user_id: targetUserId,
      measured_at: fd.get("measured_at"),
      notes: fd.get("notes") || null,
      photo_front: null,
      photo_side: null,
      photo_back: null,
    };
    for (const field of BODY_FIELDS) row[field] = numeric(fd.get(field));
    if (button) {
      button.disabled = true;
      button.textContent = "Salvando...";
    }
    setMessage(message, "Salvando medidas...");
    const { data, error } = await supabase
      .from("body_progress")
      .insert(row)
      .select("id")
      .single();
    if (error) throw error;
    setMessage(message, "Salvo com sucesso.", "success");
    if (button) {
      button.textContent = "✓ Salvo";
      button.style.background = "#8df20b";
    }
    const photoFiles = PHOTO_FIELDS.some(
      ([kind]) => form.querySelector(`[data-photo="${kind}"]`)?.files?.[0],
    );
    if (photoFiles)
      uploadPhotosInBackground(form, targetUserId, data.id, message).catch(() =>
        setMessage(
          message,
          "Medidas salvas. Não foi possível enviar uma ou mais fotos.",
          "success",
        ),
      );
    window.setTimeout(() => {
      form.reset();
      form.querySelectorAll(".be-photo").forEach((holder) => {
        holder.querySelector("img")?.remove();
        const preview = holder.querySelector(".be-photo-preview");
        if (preview) {
          preview.style.display = "grid";
          preview.textContent = "Adicionar foto";
        }
        holder.querySelectorAll('input[type="file"]').forEach((input) => {
          input.value = "";
          input.removeAttribute("data-photo");
          if (input.dataset.photoInput === "camera")
            input.dataset.photo = input.dataset.photoKind;
        });
      });
      if (button) {
        button.disabled = false;
        button.textContent = original;
        button.style.background = "";
      }
      document.dispatchEvent(
        new CustomEvent("mayfit:evolution-saved", {
          detail: { userId: targetUserId },
        }),
      );
    }, 500);
  } catch (error) {
    setMessage(
      message,
      `Não foi possível salvar: ${error.message || "erro desconhecido"}`,
      "error",
    );
    if (button) {
      button.disabled = false;
      button.textContent = original;
    }
  } finally {
    window.setTimeout(() => delete form.dataset.fastSaving, 700);
  }
}

function installFastForm(form) {
  if (form.dataset.fastSaveInstalled === "true") return;
  form.dataset.fastSaveInstalled = "true";
  form.onsubmit = null;
  form.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      handleSave(form);
    },
    true,
  );
}

async function addDeleteButtons(modal) {
  if (modal.querySelector("[data-delete-photo]")) return;
  const user = currentUser();
  if (
    user?.role !== "student" ||
    !user.id ||
    modal.dataset.photoDeleteReady === "true"
  )
    return;
  const entries = [...modal.querySelectorAll(".be-entry")];
  if (!entries.length) return;
  const { data } = await supabase
    .from("body_progress")
    .select("id,photo_front,photo_side,photo_back")
    .eq("user_id", user.id)
    .order("measured_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (!data?.length) return;
  modal.dataset.photoDeleteReady = "true";
  entries.forEach((entry, index) => {
    const record = data[index];
    if (!record) return;
    const images = [...entry.querySelectorAll(".be-gallery img")];
    const paths = [
      record.photo_front,
      record.photo_side,
      record.photo_back,
    ].filter(Boolean);
    images.forEach((img, imageIndex) => {
      const path = paths[imageIndex];
      if (!path) return;
      img.loading = "lazy";
      img.decoding = "async";
      const wrap = document.createElement("div");
      wrap.style.cssText = "position:relative;min-width:0";
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Excluir foto";
      remove.style.cssText =
        "width:100%;margin-top:5px;padding:8px;background:#3a1b1b;color:#ffb6b6;border:1px solid #693232;border-radius:9px;font-weight:850";
      remove.onclick = async () => {
        if (!confirm("Excluir esta foto da evolução?")) return;
        remove.disabled = true;
        remove.textContent = "Excluindo...";
        const column = Object.entries(record).find(
          ([, value]) => value === path,
        )?.[0];
        const storageResult = await supabase.storage
          .from("body-progress")
          .remove([path]);
        if (storageResult.error) {
          alert(
            "Não foi possível excluir a foto: " + storageResult.error.message,
          );
          remove.disabled = false;
          remove.textContent = "Excluir foto";
          return;
        }
        if (column)
          await supabase
            .from("body_progress")
            .update({ [column]: null })
            .eq("id", record.id);
        wrap.remove();
      };
      wrap.appendChild(remove);
    });
  });
}

function scan() {
  if (typeof document === "undefined") return;
  document.querySelectorAll(".be-modal form").forEach(installFastForm);
  document
    .querySelectorAll(".be-modal")
    .forEach((modal) => addDeleteButtons(modal));
}

const observer = new MutationObserver(() => {
  if (
    typeof document !== "undefined" &&
    typeof requestAnimationFrame !== "undefined"
  )
    requestAnimationFrame(scan);
});
observer.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener("mayfit:evolution-saved", () =>
  setTimeout(scan, 300),
);
scan();
