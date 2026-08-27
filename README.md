# Lampade Accese — Edizione Completa 2.0

> **Una Parola per illuminare la giornata.**  
> Sito web liturgico e spirituale quotidiano, responsive, interattivo, accessibile e funzionante anche offline (PWA).

Sito originale: [https://michelecarannante1961.github.io/lampadeaccese/](https://michelecarannante1961.github.io/lampadeaccese/)

---

## Novità e Caratteristiche di questa Versione

1. **Compatibilità Totale con la Routine di Aggiornamento (`oggi.json`)**:
   - Qualsiasi script o prompt AI che aggiorna quotidianamente `oggi.json` continuerà a funzionare al 100% senza alcuna modifica.
   - Supporto nativo ai campi opzionali estesi: `secondaLettura` (per le domeniche e feste solenni), `coloreLiturgico`, `audioUrl`, ecc.

2. **Lettore Vocale & Audio Player Integrato**:
   - Sintesi vocale italiana (Web Speech API) con controlli Play, Pausa, Stop, regolazione velocità (0.8x, 1.0x, 1.2x) ed evidenziazione del testo in tempo reale per ipovedenti e anziani.
   - Supporto per podcast e file audio esterni se specificati nel JSON.

3. **Calendario Liturgico e Navigazione Giorni**:
   - I pulsanti `<- Ieri`, `Oggi`, `Domani ->` e `Scegli data` sono pienamente attivi.
   - Modalità calendario mensile interattivo con colori liturgici (verde, viola, bianco/oro, rosso).

4. **Generatore di Immagini / Card per Social & WhatsApp**:
   - Con un click genera una splendida card ad alta risoluzione (1080x1350px) con la Frase del Giorno, tipografia Fraunces, data e pergamena dorata, pronta per il download o la condivisione diretta su WhatsApp, Instagram e Facebook.

5. **Spazio di Preghiera & Santo Rosario Interattivo**:
   - Calcolo automatico dei Misteri del giorno (Gaudiosi, Luminosi, Dolorosi, Gloriosi).
   - Meditazione dei 5 misteri e contatore interattivo a 10 grani con feedback visivo e sonoro.
   - Cantico di Zaccaria (Lodi), Cantico di Simeone (Compieta), Angelus, Padre Nostro, Ave Maria, Preghiera a San Michele.

6. **Preferiti & Diario Spirituale Privato**:
   - Possibilità di salvare le frasi preferite e scrivere riflessioni personali conservate sul dispositivo.

7. **Progressive Web App (PWA) & Funzionamento Offline**:
   - Installabile come App su smartphone (Android e iPhone) e PC.
   - Funziona anche senza connessione internet (in chiesa o in viaggio) grazie al Service Worker `sw.js`.

8. **Lampada Interattiva GSAP con Suono Realistico**:
   - Cordino con fisica elastica e interruttore tema Giorno / Notte.
   - Generatore sonoro click indipendente da connessione (Web Audio API).

---

## Struttura dei File

```
lampadeaccese/
|-- index.html                   # Pagina web principale arricchita
|-- style.css                    # Fogli di stile completi, responsive e tema giorno/notte
|-- script.js                    # Logica applicativa, lampada, audio TTS, calendario, social card
|-- oggi.json                    # Dati liturgici del giorno (100% retrocompatibile)
|-- sw.js                        # Service Worker per cache e offline PWA
|-- manifest.webmanifest         # Configurazione Progressive Web App
|-- favicon.svg                  # Favicon e icona vettoriale
|-- candela.png                  # Asset grafico originale
|-- colomba.png                  # Asset grafico originale
|-- croce.png                    # Asset grafico originale
|-- sfondo-seppia.jpg            # Texture sfondo originale
|-- data/
|   `-- archivio.json            # Database liturgico multi-giorno per la navigazione
|-- assets/                      # Copia di backup degli asset grafici
|-- aggiorna_oggi.py             # Script Python opzionale per verificare o aggiornare oggi.json
`-- README.md                    # Questa guida
```

---

## Come Pubblicare la Nuova Versione su GitHub Pages

### Metodo 1: Tramite Interfaccia Web di GitHub (Semplicissimo)
1. Estrai tutti i file dall'archivio `lampadeaccese.zip`.
2. Vai sul tuo repository GitHub: `https://github.com/michelecarannante1961/lampadeaccese`.
3. Trascina tutti i file estratti nella pagina del repository (oppure clicca su **Add file** -> **Upload files**).
4. Clicca su **Commit changes** in fondo alla pagina.
5. In 1-2 minuti, il sito sarà automaticamente aggiornato e visibile su:  
   **https://michelecarannante1961.github.io/lampadeaccese/**

---

### Metodo 2: Tramite Git da Riga di Comando
```bash
# Entra nella cartella clonata del tuo repository
cd lampadeaccese

# Copia i nuovi file nella cartella

# Aggiungi e invia le modifiche
git add .
git commit -m "Pubblica nuova versione completa 2.0 di Lampade Accese"
git push origin main
```

---

## Come Aggiornare i Contenuti Quotidiani

Per aggiornare la Parola e la liturgia di ogni giorno, basta semplicemente modificare il file `oggi.json` (tramite l'editor di GitHub o il proprio script/prompt consueto).
