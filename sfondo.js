// Salva un'immagine della pagina in PNG, JPG o WebP, convertendola nel browser.
// Nessun dato raccolto, nessun server: l'immagine si scarica dal suo sito, si converte qui e si salva sul PC.

const FORMATI = [
  { id: "png", tipo: "image/png", est: "png" },
  { id: "jpg", tipo: "image/jpeg", est: "jpg", perdita: true },
  { id: "webp", tipo: "image/webp", est: "webp", perdita: true },
];
const PREDEFINITE = { chiedi: true, qualita: 92 }; // come in impostazioni.js
const testo = (chiave, ...valori) => chrome.i18n.getMessage(chiave, valori) || chiave;

// Il menu si crea all'installazione e agli aggiornamenti (Chrome lo conserva fra un riavvio e l'altro)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "salva", title: testo("menu"), contexts: ["image"] });
    for (const f of FORMATI) {
      chrome.contextMenus.create({ id: f.id, parentId: "salva", title: testo("menu_" + f.id), contexts: ["image"] });
    }
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  const formato = FORMATI.find((f) => f.id === info.menuItemId);
  if (!formato || !info.srcUrl) return;
  // Il permesso per il sito dell'immagine va chiesto SUBITO, dentro il clic dell'utente (Chrome lo vuole così);
  // se c'è già, Chrome risponde sì senza chiedere niente.
  let permesso = Promise.resolve(true);
  const origine = origineDi(info.srcUrl);
  if (origine) permesso = chrome.permissions.request({ origins: [origine + "/*"] });
  salva(info.srcUrl, formato, permesso).catch((errore) => avvisa(testo("errore"), messaggioDi(errore)));
});

function origineDi(indirizzo) {
  try {
    const u = new URL(indirizzo);
    return u.protocol === "http:" || u.protocol === "https:" ? u.origin : null;
  } catch {
    return null;
  }
}

async function salva(indirizzo, formato, permesso) {
  if (indirizzo.startsWith("blob:")) throw new Error(testo("errore_blob"));
  if (!(await permesso)) throw new Error(testo("errore_permesso"));
  const risposta = await fetch(indirizzo, { credentials: "include" });
  if (!risposta.ok) throw new Error(testo("errore_scarico", String(risposta.status)));
  const originale = await risposta.blob();
  const scelte = await chrome.storage.sync.get(PREDEFINITE);
  const convertita = await converti(originale, formato, scelte.qualita / 100);
  await chrome.downloads.download({
    url: await inDataUrl(convertita),
    filename: nomeFile(indirizzo, formato.est),
    saveAs: scelte.chiedi,
  });
}

async function converti(blob, formato, qualita) {
  let immagine;
  try {
    immagine = await createImageBitmap(blob);
  } catch {
    throw new Error(testo("errore_formato"));
  }
  const tela = new OffscreenCanvas(immagine.width, immagine.height);
  const disegno = tela.getContext("2d");
  if (formato.tipo === "image/jpeg") {
    // il JPG non ha trasparenza: le parti trasparenti diventano bianche (non nere)
    disegno.fillStyle = "#ffffff";
    disegno.fillRect(0, 0, immagine.width, immagine.height);
  }
  disegno.drawImage(immagine, 0, 0);
  immagine.close();
  return tela.convertToBlob(formato.perdita ? { type: formato.tipo, quality: qualita } : { type: formato.tipo });
}

// Nel lavoratore di sfondo non c'è URL.createObjectURL: il file si passa ai download come indirizzo «data:»
async function inDataUrl(blob) {
  const byte = new Uint8Array(await blob.arrayBuffer());
  let binario = "";
  for (let i = 0; i < byte.length; i += 0x8000) binario += String.fromCharCode(...byte.subarray(i, i + 0x8000));
  return `data:${blob.type};base64,${btoa(binario)}`;
}

function nomeFile(indirizzo, estensione) {
  let base = "";
  try {
    const u = new URL(indirizzo);
    if (u.protocol === "http:" || u.protocol === "https:") {
      base = decodeURIComponent(u.pathname.split("/").pop() || "") || u.hostname;
    }
  } catch {
    // indirizzo strano (es. data:): si usa il nome predefinito
  }
  base = base
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_")
    .replace(/^[.\s]+|[.\s]+$/g, "")
    .slice(0, 120);
  return `${base || testo("nome_predefinito")}.${estensione}`;
}

function messaggioDi(errore) {
  return errore && errore.message ? errore.message : String(errore);
}

function avvisa(titolo, messaggio) {
  chrome.notifications.create({ type: "basic", iconUrl: "icone/128.png", title: titolo, message: messaggio });
}
