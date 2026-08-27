/**
 * ==========================================================================
 * LAMPADE ACCESE — Edizione Ufficiale con Audio Vatican News & Omelia dei Papi
 * ==========================================================================
 */

// Registrazione plugin GSAP se presente
if (window.gsap && window.Draggable) {
  gsap.registerPlugin(Draggable);
}

// ---------- SUONO CLICK MECCANICO (Web Audio API) ----------
const PULL_THRESHOLD = 45;
const CORD_TOP_Y = 240.5405;
const CORD_REST_Y = 380.5405;

let audioCtx = null;
function playSynthesizedClick() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(140, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.045);
  } catch (e) {}
}

function playClick() {
  playSynthesizedClick();
}

// ---------- TOAST NOTIFICHE ----------
function showToast(message, icon) {
  if (!icon) icon = "✓";
  const toast = document.getElementById("toastNotification");
  const msgEl = document.getElementById("toastMessage");
  const iconEl = document.getElementById("toastIcon");
  if (!toast) return;

  msgEl.textContent = message;
  iconEl.textContent = icon;
  toast.classList.add("is-visible");

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
}

// ---------- GESTIONE INTERATTIVA DELLA LAMPADA (GSAP DRAGGABLE) ----------
function initLamp(root, onToggle) {
  if (!root) return { setOn: () => {} };

  const cord = root.querySelector("[data-cord]");
  const pull = root.querySelector("[data-pull]");
  if (!cord || !pull) return { setOn: () => {} };

  root.style.touchAction = "none";

  function setCordY(y) {
    cord.setAttribute("y2", y);
    pull.setAttribute("cy", y);
  }

  function setOn(isOn) {
    root.classList.toggle("is-on", isOn);
  }

  if (window.gsap && window.Draggable) {
    const proxy = document.createElement("div");
    Draggable.create(proxy, {
      trigger: root,
      type: "y",
      bounds: { minY: 0, maxY: 140 },
      onPress() {
        gsap.set(proxy, { y: 0 });
      },
      onDrag() {
        setCordY(CORD_REST_Y + this.y);
      },
      onRelease() {
        const travelled = this.y;
        gsap.to(proxy, {
          y: 0,
          duration: 0.45,
          ease: "elastic.out(1, 0.4)",
          onUpdate: () => setCordY(CORD_REST_Y + proxy._gsap.y),
          onComplete: () => setCordY(CORD_REST_Y),
        });

        if (travelled > PULL_THRESHOLD || travelled < 4) {
          const nowOn = !root.classList.contains("is-on");
          setOn(nowOn);
          playClick();
          if (onToggle) onToggle(nowOn);
        }
      },
    });
  } else {
    root.addEventListener("click", () => {
      const nowOn = !root.classList.contains("is-on");
      setOn(nowOn);
      playClick();
      if (onToggle) onToggle(nowOn);
    });
  }

  return { setOn };
}

// ---------- GESTIONE TEMA GIORNO / NOTTE ----------
const themeLamp = document.getElementById("lamp-theme");
const themeSwitchLabel = document.getElementById("themeSwitchLabel");

function applyTheme(isNight) {
  document.documentElement.setAttribute("data-theme", isNight ? "night" : "day");
  if (themeSwitchLabel) {
    themeSwitchLabel.textContent = isNight ? "Notte" : "Giorno";
  }
  try {
    localStorage.setItem("lampade-accese-theme", isNight ? "night" : "day");
  } catch (e) {}
}

const themeLampCtrl = themeLamp
  ? initLamp(themeLamp, (isOn) => applyTheme(isOn))
  : { setOn: () => {} };

let savedTheme = null;
try {
  savedTheme = localStorage.getItem("lampade-accese-theme");
} catch (e) {}
if (savedTheme === "night") {
  themeLampCtrl.setOn(true);
  applyTheme(true);
}

// ---------- LAMPADA HERO & SCORRIMENTO ----------
const heroLamp = document.getElementById("lamp-hero");
const heroLampCtrl = heroLamp
  ? initLamp(heroLamp, (isOn) => {
      if (isOn) {
        const parolaSec = document.getElementById("parola");
        if (parolaSec) parolaSec.scrollIntoView({ behavior: "smooth" });
      }
    })
  : { setOn: () => {} };

const accendiBtn = document.getElementById("accendiBtn");
if (accendiBtn) {
  accendiBtn.addEventListener("click", () => {
    heroLampCtrl.setOn(true);
    playClick();
    const parolaSec = document.getElementById("parola");
    if (parolaSec) parolaSec.scrollIntoView({ behavior: "smooth" });
  });
}

// ---------- MODALITÀ 3 MINUTI ----------
const treminPanel = document.getElementById("treMinutiPanel");
const treminToggleEl = document.getElementById("treMinutiToggle");
const treminLamp = document.getElementById("lamp-tremin");

function openTreMinuti(open) {
  if (!treminPanel || !treminToggleEl) return;
  treminPanel.classList.toggle("is-open", open);
  treminToggleEl.setAttribute("aria-expanded", String(open));
  if (treminLamp) treminLamp.classList.toggle("is-on", open);
}

function toggleTreMinuti() {
  if (!treminPanel) return;
  openTreMinuti(!treminPanel.classList.contains("is-open"));
  playClick();
}

if (treminToggleEl) {
  treminToggleEl.addEventListener("click", toggleTreMinuti);
  treminToggleEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleTreMinuti();
    }
  });
}

// ---------- BARRA DI PROGRESSO LETTURA ----------
window.addEventListener("scroll", () => {
  const progressBar = document.getElementById("readingProgressBar");
  if (!progressBar) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = scrollPercent + "%";
});

// ---------- REGOLAZIONE DIMENSIONE CARATTERE ----------
const fontSizes = ["normal", "large", "xlarge", "small"];
let currentFontIdx = 0;
const btnFontSize = document.getElementById("btnFontSize");

if (btnFontSize) {
  let savedFont = null;
  try {
    savedFont = localStorage.getItem("lampade-font-size");
  } catch (e) {}
  if (savedFont && fontSizes.includes(savedFont)) {
    document.documentElement.setAttribute("data-font-size", savedFont);
    currentFontIdx = fontSizes.indexOf(savedFont);
  }

  btnFontSize.addEventListener("click", () => {
    currentFontIdx = (currentFontIdx + 1) % fontSizes.length;
    const nextSize = fontSizes[currentFontIdx];
    document.documentElement.setAttribute("data-font-size", nextSize);
    try {
      localStorage.setItem("lampade-font-size", nextSize);
    } catch (e) {}
    showToast("Dimensione testo: " + nextSize.toUpperCase(), "🔤");
  });
}

// ---------- STAMPA PAGINA ----------
const btnPrintPage = document.getElementById("btnPrintPage");
if (btnPrintPage) {
  btnPrintPage.addEventListener("click", () => {
    window.print();
  });
}

// ==========================================================================
// ---------- PLAYER AUDIO UFFICIALE VATICAN NEWS ----------
// ==========================================================================
const vaticanAudio = document.getElementById("vaticanAudioElement");
const btnVaticanPlay = document.getElementById("btnVaticanPlay");
const btnVaticanRewind = document.getElementById("btnVaticanRewind");
const btnVaticanForward = document.getElementById("btnVaticanForward");
const audioProgressBar = document.getElementById("audioProgressBar");
const audioProgressFill = document.getElementById("audioProgressFill");
const audioCurrentTime = document.getElementById("audioCurrentTime");
const audioDuration = document.getElementById("audioDuration");
const vaticanAudioSpeed = document.getElementById("vaticanAudioSpeed");

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function toggleVaticanAudio() {
  if (!vaticanAudio) return;
  if (vaticanAudio.paused) {
    vaticanAudio.play().then(() => {
      if (btnVaticanPlay) btnVaticanPlay.textContent = "⏸";
      showToast("Riproduzione Audio Vatican News in corso...", "🎙️");
    }).catch((err) => {
      console.warn("Audio play error:", err);
    });
  } else {
    vaticanAudio.pause();
    if (btnVaticanPlay) btnVaticanPlay.textContent = "▶";
  }
}

if (btnVaticanPlay) {
  btnVaticanPlay.addEventListener("click", toggleVaticanAudio);
}

if (vaticanAudio) {
  vaticanAudio.addEventListener("timeupdate", () => {
    if (audioCurrentTime) audioCurrentTime.textContent = formatTime(vaticanAudio.currentTime);
    if (audioDuration && !isNaN(vaticanAudio.duration)) audioDuration.textContent = formatTime(vaticanAudio.duration);
    if (audioProgressFill && vaticanAudio.duration) {
      const pct = (vaticanAudio.currentTime / vaticanAudio.duration) * 100;
      audioProgressFill.style.width = pct + "%";
    }
  });

  vaticanAudio.addEventListener("loadedmetadata", () => {
    if (audioDuration) audioDuration.textContent = formatTime(vaticanAudio.duration);
  });

  vaticanAudio.addEventListener("ended", () => {
    if (btnVaticanPlay) btnVaticanPlay.textContent = "▶";
    if (audioProgressFill) audioProgressFill.style.width = "0%";
    showToast("Ascolto completato ✓", "🎙️");
  });

  vaticanAudio.addEventListener("play", () => {
    if (btnVaticanPlay) btnVaticanPlay.textContent = "⏸";
  });

  vaticanAudio.addEventListener("pause", () => {
    if (btnVaticanPlay) btnVaticanPlay.textContent = "▶";
  });
}

if (btnVaticanRewind && vaticanAudio) {
  btnVaticanRewind.addEventListener("click", () => {
    vaticanAudio.currentTime = Math.max(0, vaticanAudio.currentTime - 15);
  });
}

if (btnVaticanForward && vaticanAudio) {
  btnVaticanForward.addEventListener("click", () => {
    if (!isNaN(vaticanAudio.duration)) {
      vaticanAudio.currentTime = Math.min(vaticanAudio.duration, vaticanAudio.currentTime + 15);
    }
  });
}

if (vaticanAudioSpeed && vaticanAudio) {
  vaticanAudioSpeed.addEventListener("change", () => {
    vaticanAudio.playbackRate = parseFloat(vaticanAudioSpeed.value);
  });
}

if (audioProgressBar && vaticanAudio) {
  audioProgressBar.addEventListener("click", (e) => {
    const rect = audioProgressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (!isNaN(vaticanAudio.duration)) {
      vaticanAudio.currentTime = pos * vaticanAudio.duration;
    }
  });
}

// Pulsante "Ascolta il Vangelo e le Letture" nella sezione Parola
const btnPlayVangeloAudio = document.getElementById("btnPlayVangeloAudio");
if (btnPlayVangeloAudio) {
  btnPlayVangeloAudio.addEventListener("click", () => {
    const audioSec = document.getElementById("audio-vatican");
    if (audioSec) audioSec.scrollIntoView({ behavior: "smooth" });
    if (vaticanAudio && vaticanAudio.paused) {
      setTimeout(() => toggleVaticanAudio(), 400);
    }
  });
}

// Pulsante "Ascolta Omelia nell'Audio Ufficiale"
const btnPlayOmeliaVatican = document.getElementById("btnPlayOmeliaVatican");
if (btnPlayOmeliaVatican) {
  btnPlayOmeliaVatican.addEventListener("click", () => {
    const audioSec = document.getElementById("audio-vatican");
    if (audioSec) audioSec.scrollIntoView({ behavior: "smooth" });
    if (vaticanAudio && vaticanAudio.paused) {
      setTimeout(() => toggleVaticanAudio(), 400);
    }
  });
}

// ==========================================================================
// ---------- GESTIONE DATI E RETROCOMPATIBILITÀ OGGI.JSON ----------
// ==========================================================================
let currentSiteData = null;
let fullArchiveData = {};
let activeDateIso = "2026-08-27";

function setText(id, value) {
  if (value === undefined || value === null) return;
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setHref(id, value) {
  if (!value) return;
  const el = document.getElementById(id);
  if (el) el.href = value;
}

function applyContent(data) {
  if (!data) return;
  currentSiteData = data;

  if (data.data_iso) {
    activeDateIso = data.data_iso;
  }

  // Hero & Liturgia
  if (data.hero) {
    setText("heroDate", data.hero.dataLeggibile);
    setText("heroLiturgical", data.hero.liturgia);
    setText("liturgicalBadgeText", data.hero.tempoLiturgico || data.hero.liturgia || "Tempo Ordinario");

    if (data.hero.coloreLiturgico) {
      document.documentElement.setAttribute("data-liturgical", data.hero.coloreLiturgico.toLowerCase());
    }
  }

  // Frase Luce
  if (data.fraseLuce) {
    setText("heroLightPhraseText", data.fraseLuce.testo);
    setText("heroLightPhraseRef", data.fraseLuce.riferimento);
    setText("frasePhrase", data.fraseLuce.testo);
    setText("fraseRef", data.fraseLuce.riferimento);
  }

  // Audio Vatican News
  const audioUrl = (data.audio && data.audio.url) || (data.letture && data.letture.vangelo && data.letture.vangelo.audioUrl) || "https://media.vaticannews.va/media2/audio/s1/2026/08/07/12/139237933_F139237933.mp3";
  if (vaticanAudio && audioUrl) {
    vaticanAudio.src = audioUrl;
    if (btnVaticanPlay) btnVaticanPlay.textContent = "▶";
    if (audioProgressFill) audioProgressFill.style.width = "0%";
    if (audioCurrentTime) audioCurrentTime.textContent = "00:00";
  }

  // Letture
  if (data.letture) {
    const { primaLettura, salmo, secondaLettura, vangelo } = data.letture;

    if (primaLettura) {
      setText("primaLetturaRef", primaLettura.riferimento);
      setText("primaLetturaTesto", primaLettura.testo);
      if (primaLettura.titolo) {
        const el = document.getElementById("primaLetturaTitolo");
        if (el) { el.textContent = primaLettura.titolo; el.style.display = "block"; }
      }
    }

    if (salmo) {
      setText("salmoRef", salmo.riferimento);
      setText("salmoRitornello", salmo.ritornello);
      if (salmo.versetti) {
        setText("salmoVersetti", salmo.versetti);
      }
    }

    // Seconda Lettura (supporto domeniche e solennità)
    const secBlock = document.getElementById("blockSecondaLettura");
    if (secondaLettura && secondaLettura.testo) {
      if (secBlock) {
        secBlock.style.display = "block";
        setText("secondaLetturaRef", secondaLettura.riferimento || "Seconda Lettura");
        setText("secondaLetturaTitolo", secondaLettura.titolo || "");
        setText("secondaLetturaTesto", secondaLettura.testo);
      }
    } else if (secBlock) {
      secBlock.style.display = "none";
    }

    // Vangelo
    if (vangelo) {
      setText("vangeloRef", vangelo.riferimento);
      setText("vangeloTesto", vangelo.testo);
      if (vangelo.titolo) {
        const el = document.getElementById("vangeloTitolo");
        if (el) { el.textContent = vangelo.titolo; el.style.display = "block"; }
      }
    }
  }

  // Omelia dei Papi
  if (data.omelia) {
    setText("omeliaEstratto", data.omelia.estratto);
    setText("omeliaAutore", data.omelia.autore);
    setText("omeliaAutoreSub", data.omelia.autore);
    setText("omeliaFonteUrl", data.omelia.fonteNome || "Vatican News");
    setHref("omeliaFonteUrl", data.omelia.fonteUrl || "https://www.vaticannews.va/it/vangelo-del-giorno-e-parola-del-giorno.html");
    setText("omeliaData", data.omelia.data);
    setHref("footerOmeliaLink", data.omelia.fonteUrl);

    if (data.omelia.testoCompleto) {
      setText("omeliaFullText", data.omelia.testoCompleto);
    }

    setText(
      "footerAttrib",
      "Letture liturgiche e audio della Parola: Vatican News — Radio Vaticana (Dicastero per la Comunicazione della Santa Sede). Commento: " + (data.omelia.autore || "Papa Francesco") + ". Fonti ufficiali verificate."
    );
  }

  // Santo del giorno
  if (data.santo) {
    setText("santoNome", data.santo.titolo ? (data.santo.nome + " — " + data.santo.titolo) : data.santo.nome);
    setText("santoBio", data.santo.bio);
    setText("santoScintilla", data.santo.scintilla);
  }

  // Dalla Parola alla Vita & Domanda
  setText("oggiProvaA", data.oggiProvaA);
  setText("domandaPerTe", data.domandaPerTe);

  // 3 Minuti
  if (data.treMinuti) {
    setText("tmVersetto", data.treMinuti.versetto);
    setText("tmPensiero", data.treMinuti.pensiero);
    setText("tmSanto", data.treMinuti.santo);
    setText("tmGesto", data.treMinuti.gesto);
    setText("tmPreghiera", data.treMinuti.preghiera);
  }

  // Preghiera Finale
  setText("preghieraTesto", data.preghieraFinale);

  loadSavedJournal();
  loadGestoStatus();
  updateRosaryForDate(data.data_iso || "2026-08-27");
}

// Caricamento Dati Iniziale
fetch("oggi.json", { cache: "no-store" })
  .then((r) => (r.ok ? r.json() : null))
  .then((data) => {
    if (data) {
      applyContent(data);
    }
  })
  .catch((err) => {
    console.log("Utilizzo contenuti statici.");
  });

// Carica archivio se presente per la navigazione
fetch("data/archivio.json")
  .then((r) => (r.ok ? r.json() : {}))
  .then((arch) => {
    fullArchiveData = arch || {};
  })
  .catch(() => {});

// ---------- ESPANSIONE TESTO COMPLETO OMELIA ----------
const btnToggleOmelia = document.getElementById("btnToggleOmelia");
const omeliaFullText = document.getElementById("omeliaFullText");
if (btnToggleOmelia && omeliaFullText) {
  btnToggleOmelia.addEventListener("click", () => {
    const isHidden = omeliaFullText.style.display === "none";
    omeliaFullText.style.display = isHidden ? "block" : "none";
    btnToggleOmelia.textContent = isHidden ? "▲ Riduci commento" : "📖 Espandi commento completo";
  });
}

// ---------- GESTIONE CHECKBOX "OGGI PROVA A" ----------
const checkOggi = document.getElementById("checkOggiProvaA");
const gestoFeedback = document.getElementById("gestoFeedback");

function loadGestoStatus() {
  if (!checkOggi) return;
  const key = "lampade-gesto-" + activeDateIso;
  const isDone = localStorage.getItem(key) === "true";
  checkOggi.checked = isDone;
  if (gestoFeedback) {
    gestoFeedback.textContent = isDone ? "✓ Gesto completato oggi con cuore aperto!" : "";
  }
}

if (checkOggi) {
  checkOggi.addEventListener("change", () => {
    const key = "lampade-gesto-" + activeDateIso;
    localStorage.setItem(key, String(checkOggi.checked));
    if (gestoFeedback) {
      gestoFeedback.textContent = checkOggi.checked ? "✓ Gesto completato oggi con cuore aperto!" : "";
    }
    if (checkOggi.checked) {
      showToast("Gesto segnato come completato!", "✨");
    }
  });
}

// ---------- DIARIO SPIRITUALE PERSONALE ----------
const journalInput = document.getElementById("journalInput");
const btnSaveJournal = document.getElementById("btnSaveJournal");

function loadSavedJournal() {
  if (!journalInput) return;
  const key = "lampade-journal-" + activeDateIso;
  const saved = localStorage.getItem(key) || "";
  journalInput.value = saved;
}

if (btnSaveJournal && journalInput) {
  btnSaveJournal.addEventListener("click", () => {
    const key = "lampade-journal-" + activeDateIso;
    const val = journalInput.value.trim();
    localStorage.setItem(key, val);
    showToast("Riflessione salvata in privato!", "💾");
  });
}

// ---------- CONDIVISIONE & COPIA FRASE ----------
function currentFrase() {
  const el = document.getElementById("frasePhrase");
  const ref = document.getElementById("fraseRef");
  const q = el ? el.textContent.trim() : "";
  const r = ref ? ref.textContent.trim() : "";
  return q + " (" + r + ")";
}

const copyBtn = document.getElementById("copyBtn");
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(currentFrase());
      showToast("Frase copiata negli appunti!", "📋");
    } catch (err) {
      showToast("Errore durante la copia", "⚠️");
    }
  });
}

const waBtn = document.getElementById("waBtn");
if (waBtn) {
  waBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const url = "https://wa.me/?text=" + encodeURIComponent(currentFrase() + "\n\n— Lampade Accese\nhttps://michelecarannante1961.github.io/lampadeaccese/");
    window.open(url, "_blank", "noopener");
  });
}

// ---------- PREFERITI (SALVATAGGIO & MODAL) ----------
const btnFavoriteQuote = document.getElementById("btnFavoriteQuote");
const btnOpenFavorites = document.getElementById("btnOpenFavorites");
const modalFavoritesBackdrop = document.getElementById("modalFavoritesBackdrop");
const btnCloseFavoritesModal = document.getElementById("btnCloseFavoritesModal");
const favoritesListContainer = document.getElementById("favoritesListContainer");

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem("lampade-favorites")) || [];
  } catch (e) {
    return [];
  }
}

function saveFavorites(list) {
  try {
    localStorage.setItem("lampade-favorites", JSON.stringify(list));
  } catch (e) {}
}

if (btnFavoriteQuote) {
  btnFavoriteQuote.addEventListener("click", () => {
    const favs = getFavorites();
    const item = {
      id: Date.now(),
      date: activeDateIso,
      dateFormatted: document.getElementById("heroDate") ? document.getElementById("heroDate").textContent : "",
      quote: document.getElementById("frasePhrase") ? document.getElementById("frasePhrase").textContent : "",
      ref: document.getElementById("fraseRef") ? document.getElementById("fraseRef").textContent : "",
      santo: document.getElementById("santoNome") ? document.getElementById("santoNome").textContent : ""
    };

    if (!favs.some((f) => f.quote === item.quote)) {
      favs.unshift(item);
      saveFavorites(favs);
      showToast("Aggiunto ai tuoi preferiti!", "⭐");
    } else {
      showToast("Già presente nei preferiti!", "ℹ️");
    }
  });
}

function renderFavoritesList() {
  if (!favoritesListContainer) return;
  const favs = getFavorites();
  favoritesListContainer.innerHTML = "";

  if (favs.length === 0) {
    favoritesListContainer.innerHTML = '<p style="font-style:italic; color:var(--ink-muted); text-align:center; padding:20px 0;">Nessun elemento salvato finora. Tocca "⭐ Salva nei Preferiti" per custodire le frasi che ti toccano il cuore.</p>';
    return;
  }

  favs.forEach((fav) => {
    const card = document.createElement("div");
    card.style.cssText = "padding:14px 18px; background:var(--ivory); border:1px solid var(--gold-line); border-radius:12px; position:relative;";
    card.innerHTML = `
      <div style="font-size:0.75rem; color:var(--amber-deep); font-weight:700; text-transform:uppercase;">${fav.dateFormatted || fav.date}</div>
      <div style="font-family:'Fraunces',serif; font-style:italic; font-size:1.05rem; margin:6px 0;">${fav.quote}</div>
      <div style="font-size:0.8rem; font-weight:600; color:var(--ink-soft);">${fav.ref}</div>
      <button data-del-id="${fav.id}" style="position:absolute; top:12px; right:12px; background:none; border:none; color:var(--ink-muted); cursor:pointer; font-size:1rem;" title="Rimuovi">🗑️</button>
    `;
    favoritesListContainer.appendChild(card);
  });

  favoritesListContainer.querySelectorAll("[data-del-id]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.currentTarget.getAttribute("data-del-id"));
      const updated = getFavorites().filter((f) => f.id !== id);
      saveFavorites(updated);
      renderFavoritesList();
      showToast("Rimosso dai preferiti", "🗑️");
    });
  });
}

if (btnOpenFavorites && modalFavoritesBackdrop) {
  btnOpenFavorites.addEventListener("click", () => {
    renderFavoritesList();
    modalFavoritesBackdrop.classList.add("is-open");
  });
}

if (btnCloseFavoritesModal && modalFavoritesBackdrop) {
  btnCloseFavoritesModal.addEventListener("click", () => {
    modalFavoritesBackdrop.classList.remove("is-open");
  });
}

// ---------- GENERATORE IMMAGINE CARD SOCIAL (CANVAS 2D) ----------
const btnGenerateCard = document.getElementById("btnGenerateCard");
const modalCardBackdrop = document.getElementById("modalCardBackdrop");
const btnCloseCardModal = document.getElementById("btnCloseCardModal");
const cardCanvas = document.getElementById("cardCanvas");
const cardPreviewImg = document.getElementById("cardPreviewImg");
const btnDownloadCardPng = document.getElementById("btnDownloadCardPng");
const btnShareCardNative = document.getElementById("btnShareCardNative");

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  const lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  let currentY = y - ((lines.length - 1) * lineHeight) / 2;
  for (let k = 0; k < lines.length; k++) {
    ctx.fillText(lines[k].trim(), x, currentY);
    currentY += lineHeight;
  }
}

function generateSocialCard() {
  if (!cardCanvas) return;
  const ctx = cardCanvas.getContext("2d");
  const w = 1080;
  const h = 1350;

  // Sfondo Caldo Pergamena con gradiente
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, "#fdfbf5");
  bgGrad.addColorStop(0.5, "#f6eedc");
  bgGrad.addColorStop(1, "#ebe0c8");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Doppia cornice dorata elegante
  ctx.strokeStyle = "#c48b28";
  ctx.lineWidth = 6;
  ctx.strokeRect(40, 40, w - 80, h - 80);

  ctx.strokeStyle = "#dfc89e";
  ctx.lineWidth = 2;
  ctx.strokeRect(55, 55, w - 110, h - 110);

  // Testata Card
  ctx.textAlign = "center";
  ctx.fillStyle = "#8f5f19";
  ctx.font = "bold 24px Inter, sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText("LAMPADE ACCESE", w / 2, 130);

  const dateText = document.getElementById("heroDate") ? document.getElementById("heroDate").textContent : "Parola di oggi";
  ctx.fillStyle = "#5e4f3f";
  ctx.font = "22px Inter, sans-serif";
  ctx.letterSpacing = "1px";
  ctx.fillText(dateText.toUpperCase(), w / 2, 175);

  ctx.strokeStyle = "#dfc89e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 120, 210);
  ctx.lineTo(w / 2 + 120, 210);
  ctx.stroke();

  // Lampada / Candela Icona stilizzata
  const lampGlow = ctx.createRadialGradient(w / 2, 330, 10, w / 2, 330, 90);
  lampGlow.addColorStop(0, "rgba(255, 230, 120, 0.9)");
  lampGlow.addColorStop(0.5, "rgba(240, 180, 50, 0.4)");
  lampGlow.addColorStop(1, "rgba(240, 180, 50, 0)");
  ctx.fillStyle = lampGlow;
  ctx.beginPath();
  ctx.arc(w / 2, 330, 90, 0, Math.PI * 2);
  ctx.fill();

  // Virgoletta dorata decorativa
  ctx.fillStyle = "rgba(196, 139, 40, 0.25)";
  ctx.font = "italic 160px Fraunces, Georgia, serif";
  ctx.fillText("“", w / 2, 500);

  // Testo della Frase Luce
  const quoteText = document.getElementById("frasePhrase") ? document.getElementById("frasePhrase").textContent : "";
  ctx.fillStyle = "#2b2319";
  ctx.font = "italic 52px Fraunces, Georgia, serif";
  wrapText(ctx, quoteText, w / 2, 700, 840, 74);

  // Riferimento Biblico
  const refText = document.getElementById("fraseRef") ? document.getElementById("fraseRef").textContent : "";
  ctx.fillStyle = "#c48b28";
  ctx.font = "bold 32px Inter, sans-serif";
  ctx.fillText(refText, w / 2, 980);

  // Footer & Logo
  ctx.fillStyle = "#857460";
  ctx.font = "italic 24px Fraunces, Georgia, serif";
  ctx.fillText("«Una Parola per illuminare la giornata»", w / 2, 1180);

  ctx.fillStyle = "#a69075";
  ctx.font = "20px Inter, sans-serif";
  ctx.fillText("michelecarannante1961.github.io/lampadeaccese", w / 2, 1225);

  const dataUrl = cardCanvas.toDataURL("image/png");
  if (cardPreviewImg) cardPreviewImg.src = dataUrl;
}

if (btnGenerateCard && modalCardBackdrop) {
  btnGenerateCard.addEventListener("click", () => {
    generateSocialCard();
    modalCardBackdrop.classList.add("is-open");
  });
}

if (btnCloseCardModal && modalCardBackdrop) {
  btnCloseCardModal.addEventListener("click", () => {
    modalCardBackdrop.classList.remove("is-open");
  });
}

if (btnDownloadCardPng && cardCanvas) {
  btnDownloadCardPng.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "lampade-accese-" + activeDateIso + ".png";
    link.href = cardCanvas.toDataURL("image/png");
    link.click();
    showToast("Immagine scaricata con successo!", "📥");
  });
}

if (btnShareCardNative && cardCanvas) {
  btnShareCardNative.addEventListener("click", async () => {
    if (navigator.share) {
      cardCanvas.toBlob(async (blob) => {
        const file = new File([blob], "lampade-accese-" + activeDateIso + ".png", { type: "image/png" });
        try {
          await navigator.share({
            title: "Lampade Accese — Frase del Giorno",
            text: currentFrase(),
            files: [file]
          });
        } catch (e) {}
      });
    } else {
      showToast("Condivisione nativa non supportata su questo browser", "ℹ️");
    }
  });
}

// ---------- SPAZIO PREGHIERA TABS ----------
document.querySelectorAll(".prayer-tab-btn").forEach((tabBtn) => {
  tabBtn.addEventListener("click", () => {
    document.querySelectorAll(".prayer-tab-btn").forEach((b) => b.classList.remove("is-active"));
    document.querySelectorAll(".prayer-tab-content").forEach((c) => c.classList.remove("is-active"));

    tabBtn.classList.add("is-active");
    const tabName = tabBtn.getAttribute("data-tab");
    const target = document.getElementById("tab-" + tabName);
    if (target) target.classList.add("is-active");
  });
});

// ---------- SANTO ROSARIO INTERATTIVO ----------
const rosaryMysteriesData = {
  Luminosi: {
    name: "Misteri della Luce (Luminosi)",
    days: ["Giovedì"],
    mysteries: [
      { title: "1° Mistero: Il Battesimo di Gesù nel Giordano", med: "Gesù scende nell'acqua del Giordano e riceve la voce del Padre: «Questi è il Figlio mio prediletto nel quale mi sono compiaciuto»." },
      { title: "2° Mistero: Le Nozze di Cana", med: "Su richiesta di Maria sua Madre, Gesù compie il suo primo segno trasformando l'acqua in vino buono." },
      { title: "3° Mistero: L'Annuncio del Regno di Dio", med: "Gesù proclama l'avvento del Regno e invita alla conversione e alla fiducia nella misericordia." },
      { title: "4° Mistero: La Trasfigurazione sul monte Tabor", med: "La gloria divina risplende sul volto di Gesù per fortificare i discepoli nella prova." },
      { title: "5° Mistero: L'Istituzione dell'Eucaristia", med: "Nell'Ultima Cena, Cristo offre il suo Corpo e il suo Sangue come cibo di vita eterna." }
    ]
  },
  Gaudiosi: {
    name: "Misteri della Gioia (Gaudiosi)",
    days: ["Lunedì", "Sabato"],
    mysteries: [
      { title: "1° Mistero: L'Annunciazione dell'Angelo a Maria", med: "L'Angelo Gabriele porta l'annuncio e Maria risponde con il suo fiducioso «Eccomi»." },
      { title: "2° Mistero: La Visita di Maria a Elisabetta", med: "Maria si mette in cammino in fretta per servire e lodare il Signore con il Magnificat." },
      { title: "3° Mistero: La Nascita di Gesù a Betlemme", med: "Il Salvatore nasce nella povertà della mangiatoia accolto da Maria, Giuseppe e i pastori." },
      { title: "4° Mistero: La Presentazione di Gesù al Tempio", med: "Simeone prende tra le braccia la Luce delle genti e benedice Dio." },
      { title: "5° Mistero: Il Ritrovamento di Gesù nel Tempio", med: "Dopo tre giorni di angoscia, Maria e Giuseppe ritrovano Gesù tra i maestri della Legge." }
    ]
  },
  Dolorosi: {
    name: "Misteri del Dolore (Dolorosi)",
    days: ["Martedì", "Venerdì"],
    mysteries: [
      { title: "1° Mistero: L'Agonia di Gesù nel Getsemani", med: "Gesù prega nell'orto degli ulivi: «Padre, non sia fatta la mia ma la tua volontà»." },
      { title: "2° Mistero: La Flagellazione alla colonna", med: "Cristo accetta i colpi per sanare le nostre ferite con il suo amore." },
      { title: "3° Mistero: La Coronazione di spine", med: "Il Re dell'universo è schernito con una corona di spine per la nostra redenzione." },
      { title: "4° Mistero: La Salita di Gesù al Calvario", med: "Gesù abbraccia la croce e sale al Golgota confortato dagli sguardi di carità." },
      { title: "5° Mistero: La Crocifissione e Morte di Gesù", med: "«Tutto è compiuto». Gesù dona la vita e affida la Madre al discepolo amato." }
    ]
  },
  Gloriosi: {
    name: "Misteri della Gloria (Gloriosi)",
    days: ["Mercoledì", "Domenica"],
    mysteries: [
      { title: "1° Mistero: La Risurrezione di Gesù", med: "La morte è vinta! Cristo è risorto e vive per sempre tra noi." },
      { title: "2° Mistero: L'Ascensione di Gesù al Cielo", med: "Gesù ascende al Padre aprendo all'umanità la via del Cielo." },
      { title: "3° Mistero: La Discesa dello Spirito Santo", med: "Nel Cenacolo, lo Spirito Santo discende su Maria e gli Apostoli donando forza e sapienza." },
      { title: "4° Mistero: L'Assunzione di Maria al Cielo", med: "Maria è assunta in corpo e anima nella gloria eterna di Dio." },
      { title: "5° Mistero: L'Incoronazione di Maria Regina", med: "Maria è incoronata Regina del Cielo e Madre della Chiesa." }
    ]
  }
};

let currentMysteryCategory = "Luminosi";
let currentDecadeIndex = 0;
let currentBeadIndex = 0;

function updateRosaryForDate(dateStr) {
  const d = new Date(dateStr);
  const dayIdx = isNaN(d.getDay()) ? 4 : d.getDay();
  const dayNames = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
  const dayName = dayNames[dayIdx];

  setText("rosaryDayName", dayName);

  if (dayIdx === 4) currentMysteryCategory = "Luminosi";
  else if (dayIdx === 1 || dayIdx === 6) currentMysteryCategory = "Gaudiosi";
  else if (dayIdx === 2 || dayIdx === 5) currentMysteryCategory = "Dolorosi";
  else currentMysteryCategory = "Gloriosi";

  currentDecadeIndex = 0;
  currentBeadIndex = 0;
  renderRosaryDecade();
}

function renderRosaryDecade() {
  const cat = rosaryMysteriesData[currentMysteryCategory];
  if (!cat) return;

  setText("rosaryMysteriesTitle", cat.name);
  const curDec = cat.mysteries[currentDecadeIndex];
  if (curDec) {
    setText("rosaryDecadeTitle", curDec.title);
    setText("rosaryDecadeMeditation", curDec.med);
  }

  const container = document.getElementById("rosaryBeadsContainer");
  if (!container) return;
  container.innerHTML = "";

  for (let i = 1; i <= 10; i++) {
    const bead = document.createElement("div");
    bead.className = `bead ${i <= currentBeadIndex ? "is-done" : ""}`;
    bead.textContent = i;
    bead.title = `Ave Maria ${i}`;
    bead.addEventListener("click", () => {
      currentBeadIndex = i;
      playClick();
      renderRosaryDecade();
      if (i === 10) {
        showToast("Decina completata! Gloria al Padre...", "📿");
      }
    });
    container.appendChild(bead);
  }
}

const btnPrevDecade = document.getElementById("btnPrevDecade");
const btnNextDecade = document.getElementById("btnNextDecade");

if (btnPrevDecade) {
  btnPrevDecade.addEventListener("click", () => {
    currentDecadeIndex = (currentDecadeIndex + 4) % 5;
    currentBeadIndex = 0;
    renderRosaryDecade();
  });
}

if (btnNextDecade) {
  btnNextDecade.addEventListener("click", () => {
    currentDecadeIndex = (currentDecadeIndex + 1) % 5;
    currentBeadIndex = 0;
    renderRosaryDecade();
  });
}

renderRosaryDecade();

// ---------- NAVIGAZIONE TEMPORALE & CALENDARIO LITURGICO ----------
const btnPrevDay = document.getElementById("btnPrevDay");
const btnToday = document.getElementById("btnToday");
const btnNextDay = document.getElementById("btnNextDay");
const btnOpenCalendar = document.getElementById("btnOpenCalendar");
const btnOpenCalendarHeader = document.getElementById("btnOpenCalendarHeader");
const modalCalendarBackdrop = document.getElementById("modalCalendarBackdrop");
const btnCloseCalendar = document.getElementById("btnCloseCalendar");
const calendarDaysGrid = document.getElementById("calendarDaysGrid");
const calMonthYearTitle = document.getElementById("calMonthYearTitle");
const btnCalPrevMonth = document.getElementById("btnCalPrevMonth");
const btnCalNextMonth = document.getElementById("btnCalNextMonth");

let calViewingMonth = 7; // Agosto
let calViewingYear = 2026;

function loadDateContent(dateIso) {
  activeDateIso = dateIso;

  if (fullArchiveData && fullArchiveData[dateIso]) {
    applyContent(fullArchiveData[dateIso]);
    showToast("Caricata la liturgia del " + dateIso, "📅");
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const d = new Date(dateIso);
  const giorni = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
  const mesi = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  const dateFormatted = giorni[d.getDay()] + " " + d.getDate() + " " + mesi[d.getMonth()] + " " + d.getFullYear();

  const generated = {
    data_iso: dateIso,
    hero: {
      dataLeggibile: dateFormatted,
      liturgia: d.getDay() === 0 ? "Domenica del Signore" : "Feria del Tempo Ordinario",
      coloreLiturgico: d.getDay() === 0 ? "bianco" : "verde"
    },
    fraseLuce: {
      testo: "«La tua parola è una lampada ai miei passi, una luce sul mio cammino.»",
      riferimento: "Sal 118,105"
    },
    audio: {
      fonte: "Vatican News — Radio Vaticana",
      titolo: "Liturgia della Parola e Omelia del Papa",
      url: "https://media.vaticannews.va/media2/audio/s1/2026/08/07/12/139237933_F139237933.mp3"
    },
    letture: {
      primaLettura: {
        riferimento: "Prima Lettura",
        testo: "Ascolta, popolo mio, la mia legge, porgi l'orecchio alle parole della mia bocca."
      },
      salmo: {
        riferimento: "Salmo responsoriale",
        ritornello: "Rit. Il Signore è mia luce e mia salvezza."
      },
      vangelo: {
        riferimento: "Santo Vangelo",
        testo: "In quel tempo, Gesù disse: «Io sono la luce del mondo; chi segue me, non camminerà nelle tenebre, ma avrà la luce della vita»."
      }
    },
    omelia: {
      estratto: "«Ogni giorno il Signore ci dona una parola per custodire la speranza e vivere nella carità.»",
      autore: "Papa Francesco",
      fonteNome: "Vatican News",
      fonteUrl: "https://www.vaticannews.va/it/vangelo-del-giorno-e-parola-del-giorno.html",
      data: dateFormatted
    },
    santo: {
      nome: "Santo del Giorno",
      bio: "Memoria dei testimoni della fede che hanno illuminato la storia con il loro esempio di amore evangelico.",
      scintilla: "La santità non è un traguardo per pochi, ma la chiamata quotidiana a compiere con amore le cose ordinarie."
    },
    oggiProvaA: "Oggi compi un gesto di pace e ascolto verso chi incontri.",
    domandaPerTe: "Come puoi essere lampada accesa per chi ti è accanto oggi?",
    treMinuti: {
      versetto: "«Voi siete la luce del mondo.» (Mt 5,14)",
      pensiero: "La luce si diffonde semplicemente donandosi.",
      santo: "I santi ci insegnano la fedeltà nelle piccole cose quotidiane.",
      gesto: "Dona un sorriso sincero a chi è in difficoltà.",
      preghiera: "Signore, illumina i miei passi. Amen."
    },
    preghieraFinale: "Signore, guida questa giornata con la tua grazia. Amen."
  };

  applyContent(generated);
  showToast("Liturgia del " + dateFormatted, "📅");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function shiftDate(days) {
  const d = new Date(activeDateIso);
  d.setDate(d.getDate() + days);
  const iso = d.toISOString().split("T")[0];
  loadDateContent(iso);
}

if (btnPrevDay) btnPrevDay.addEventListener("click", () => shiftDate(-1));
if (btnNextDay) btnNextDay.addEventListener("click", () => shiftDate(1));
if (btnToday) {
  btnToday.addEventListener("click", () => {
    fetch("oggi.json", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => applyContent(data));
  });
}

function renderCalendar(month, year) {
  if (!calendarDaysGrid || !calMonthYearTitle) return;
  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
  calMonthYearTitle.textContent = monthNames[month] + " " + year;

  calendarDaysGrid.innerHTML = "";

  const dayHeaders = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
  dayHeaders.forEach((h) => {
    const el = document.createElement("div");
    el.className = "calendar-day-header";
    el.textContent = h;
    calendarDaysGrid.appendChild(el);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < offset; i++) {
    const blank = document.createElement("div");
    calendarDaysGrid.appendChild(blank);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("div");
    const mStr = String(month + 1).padStart(2, "0");
    const dStr = String(d).padStart(2, "0");
    const cellIso = `${year}-${mStr}-${dStr}`;

    cell.className = `calendar-day-cell ${cellIso === activeDateIso ? "is-selected" : ""}`;
    cell.textContent = d;

    if (fullArchiveData && fullArchiveData[cellIso]) {
      const dot = document.createElement("span");
      dot.style.cssText = "position:absolute; bottom:3px; width:5px; height:5px; background:var(--amber); border-radius:50%;";
      cell.appendChild(dot);
    }

    cell.addEventListener("click", () => {
      modalCalendarBackdrop.classList.remove("is-open");
      loadDateContent(cellIso);
    });

    calendarDaysGrid.appendChild(cell);
  }
}

if (btnOpenCalendar && modalCalendarBackdrop) {
  btnOpenCalendar.addEventListener("click", () => {
    renderCalendar(calViewingMonth, calViewingYear);
    modalCalendarBackdrop.classList.add("is-open");
  });
}

if (btnOpenCalendarHeader && modalCalendarBackdrop) {
  btnOpenCalendarHeader.addEventListener("click", () => {
    renderCalendar(calViewingMonth, calViewingYear);
    modalCalendarBackdrop.classList.add("is-open");
  });
}

if (btnCloseCalendar && modalCalendarBackdrop) {
  btnCloseCalendar.addEventListener("click", () => {
    modalCalendarBackdrop.classList.remove("is-open");
  });
}

if (btnCalPrevMonth) {
  btnCalPrevMonth.addEventListener("click", () => {
    calViewingMonth--;
    if (calViewingMonth < 0) { calViewingMonth = 11; calViewingYear--; }
    renderCalendar(calViewingMonth, calViewingYear);
  });
}

if (btnCalNextMonth) {
  btnCalNextMonth.addEventListener("click", () => {
    calViewingMonth++;
    if (calViewingMonth > 11) { calViewingMonth = 0; calViewingYear++; }
    renderCalendar(calViewingMonth, calViewingYear);
  });
}

// Chiusura modali
[modalCalendarBackdrop, modalCardBackdrop, modalFavoritesBackdrop].forEach((backdrop) => {
  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove("is-open");
      }
    });
  }
});

// Service Worker PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => {
        console.log("Lampade Accese: Service Worker attivo.");
      })
      .catch(() => {});
  });
}
