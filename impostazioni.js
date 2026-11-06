// Pagina delle impostazioni: si salvano da sole a ogni modifica (chrome.storage.sync, nessun server).
const PREDEFINITE = { chiedi: true, qualita: 92 };

for (const elemento of document.querySelectorAll("[data-testo]")) {
  elemento.textContent = chrome.i18n.getMessage(elemento.dataset.testo);
}

const chiedi = document.getElementById("chiedi");
const qualita = document.getElementById("qualita");
const valore = document.getElementById("valore");
const salvato = document.getElementById("salvato");
let attesa;

chrome.storage.sync.get(PREDEFINITE, (scelte) => {
  chiedi.checked = scelte.chiedi;
  qualita.value = scelte.qualita;
  valore.textContent = scelte.qualita;
});

function salva() {
  chrome.storage.sync.set({ chiedi: chiedi.checked, qualita: Number(qualita.value) }, () => {
    salvato.textContent = chrome.i18n.getMessage("opz_salvato");
    clearTimeout(attesa);
    attesa = setTimeout(() => (salvato.textContent = ""), 1500);
  });
}

chiedi.addEventListener("change", salva);
qualita.addEventListener("input", () => (valore.textContent = qualita.value));
qualita.addEventListener("change", salva);
