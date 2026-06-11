# AUDIT – MiKi-Homepage

> Bestandsaufnahme vom 11.06.2026. Reine Analyse – es wurde **nichts** am Code geändert.
> Live: https://www.miki-hdh.de · Auslieferung über GitHub Pages

---

## 1. Projektstruktur & Setup

```
MiKi-Homepage/
├── index.html          ← die GESAMTE Seite (1336 Zeilen): HTML + CSS inline + Vue-App inline
├── styles.css          ← 531 Zeilen, NICHT eingebunden (toter Code, altes Design)
├── package.json        ← nur Dev-Hilfen (serve, phosphor), kein Build
├── package-lock.json
├── CNAME               ← www.miki-hdh.de
├── README.md           ← faktisch leer
├── extern/
│   ├── vue.globals.js  ← 574 KB (vollständiger globaler Vue-Build)
│   ├── marked.min.js   ← 39 KB (Markdown-Parser – nur für toten Blog-Code, s. u.)
│   ├── fonts/          ← „Just Me Again Down Here" (genutzt)
│   └── phosphor/       ← Icon-Font (genutzt)
└── Assets/             ← 42 MB Bilder/Fonts (davon ~40 MB ungenutzt, s. Abschnitt 3)
```

**Build-Setup:** Es gibt **keinen Build-Schritt.** Kein Bundler (Vite/Webpack), kein npm-Build, keine Minifizierung. Die `index.html` wird so, wie sie ist, von GitHub Pages als statische Datei ausgeliefert. `package.json` enthält nur `serve .` für die lokale Vorschau und Phosphor als nominelle Abhängigkeit (die Icons liegen aber bereits lokal unter `extern/phosphor/` und werden von dort geladen – das npm-Paket wird zur Laufzeit nicht gebraucht).

**Abhängigkeiten (zur Laufzeit):**
- **Vue 3** (global build, `extern/vue.globals.js`) – steuert die ganze Interaktivität
- **marked** (`extern/marked.min.js`) – Markdown → HTML, **wird aber nirgends sichtbar genutzt** (s. u.)
- **Phosphor Icons** (lokaler Icon-Font)
- Eine Handschrift-Schriftart (lokal)

Alle Ressourcen werden **lokal** ausgeliefert – keine externen CDNs. Das ist datenschutzrechtlich sauber und passt zur Aussage in der Datenschutzerklärung („keine Einbindung externer Inhalte").

---

## 2. Wie wird die Seite gebaut und ausgeliefert? (in einfachen Worten)

Stell dir die `index.html` wie ein einziges Faltblatt vor, auf dem alles draufsteht: der sichtbare Inhalt, das komplette Design (CSS) und das „Gehirn" (die Vue-App als JavaScript) – alles in einer Datei. GitHub Pages legt dieses Faltblatt einfach ins Schaufenster, ohne es vorher zu bearbeiten.

**Werden die Inhalte fertig ausgeliefert oder erst im Browser erzeugt?**
→ **Sie werden erst im Browser per JavaScript (Vue) erzeugt.** Das ist wichtig zu verstehen:

- Die **Texte von Events, Baufortschritt und den Foto-Beschreibungen** stehen **nicht** als fertiges HTML in der Datei. Sie liegen als JavaScript-Datenlisten vor (z. B. `events = [...]`, `progress = [...]`) und werden erst durch Vue in sichtbare Karten verwandelt, **nachdem** der Browser die Seite geladen und das JavaScript ausgeführt hat.
- Konsequenz **für die Nutzer:** Wer kein/langsames JavaScript hat, sieht kurz eine fast leere Seite. Für die allermeisten Besucher ist das aber unkritisch.
- Konsequenz **für Google & Co. (SEO):** Suchmaschinen sehen im Roh-HTML diese Inhalte zunächst nicht. Google rendert zwar JavaScript nach, aber andere Crawler / Social-Media-Vorschauen oft nicht zuverlässig. Die **statischen** Teile (Vision-Text, Datenschutz, Impressum, Meta-Tags) stehen dagegen fest im HTML und sind immer sichtbar.

Kurz: **Statische Inhalte** (Vision, Rechtstexte, Überschriften) stehen fertig im HTML. **Dynamische Listen** (Events, Baufortschritt) werden im Browser zusammengebaut.

---

## 3. Code-Dopplungen, ungenutzte Dateien & toter Code

> Nur Auflistung – **nichts wurde entfernt.** Reihenfolge grob nach Aufräum-Nutzen.

### 3a. Komplett ungenutzte Dateien

| Datei | Größe | Status |
|---|---|---|
| `styles.css` | 531 Zeilen | **Nirgends eingebunden.** Altes Design (Inter-Font, andere Farben, `--secondary: #FFFFED`). Die aktive Seite nutzt ausschließlich die Inline-Styles in `index.html`. |
| `extern/marked.min.js` | 39 KB | Wird geladen, aber nur vom toten Blog-Code (s. 3c) benutzt. Nach Entfernen des Blog-Codes überflüssig. |
| `Assets/GochiHand-Regular.ttf` | – | In keiner CSS/HTML referenziert. |

### 3b. Ungenutzte Bilder im Repo (~40 MB)

Diese liegen im Repo, werden aber **vom Browser nie angefordert** (entweder gar nicht referenziert oder nur in totem JS-Code). Sie belasten nicht die Ladezeit, blähen aber das Repo auf:

| Datei | Größe | Warum ungenutzt |
|---|---|---|
| `Assets/U1.png` | **12,3 MB** | nur im toten `photos`-Array (s. 3c) |
| `Assets/U2.png` | **12,2 MB** | nur im toten `photos`-Array |
| `Assets/U3.png` | **11,2 MB** | nur im toten `photos`-Array |
| `Assets/P2.png` | 1,9 MB | durch `P2.webp` ersetzt |
| `Assets/P4.jpg` | 565 KB | war früher Hero-Bild, jetzt durch T-Bilder ersetzt |
| `Assets/W4.webp` | 190 KB | im Modal wird `W4.jpeg` genutzt (s. „Achtung" unten) |
| `Assets/P2.jpeg` | 130 KB | durch `P2.webp` ersetzt |

→ **~38,5 MB** allein durch U1–U3. Diese drei sind zudem unkomprimierte PNGs in voller Auflösung.

### 3c. Toter JavaScript-Code in `index.html`

Zwei ganze Funktionsblöcke sind verkabelt, werden aber nie ausgelöst:

1. **Blog/News (Markdown):** `posts`, `loadingPosts`, `fetchPosts()`, `fallbackMarkdown` und beide `marked.parse(...)`-Aufrufe. Es gibt **kein** Template-Markup, das `posts` rendert (kein `v-html`, keine `v-for` über posts). Der Code läuft beim Laden (inkl. künstlichem 800 ms-`setTimeout`), das Ergebnis wird aber nirgends angezeigt. → macht `marked.min.js` überflüssig.
2. **Foto-Karussell / Lightbox:** `photos` (U1–U3), `currentPhoto`, `nextPhoto()`, `previousPhoto()`, `openLightbox()`. Die Lightbox-Modal-Markup existiert (`v-if="lightboxPhoto"`), aber `openLightbox` wird **nirgends** aufgerufen → `lightboxPhoto` wird nie gesetzt → das Modal kann nie erscheinen.

Beide Blöcke sind außerdem unnötig im `return` der `setup()`-Funktion exportiert.

### 3d. CSS-Dopplungen / -Leichen (innerhalb `index.html`)

- **`.progress-item` ist doppelt definiert** (Zeile ~400 und ~437). Der zweite Block ergänzt nur `cursor`/`hover` – ließe sich zusammenführen.
- **`.blog-card`, `.blog-header`, `.blog-content`** – CSS für den toten Blog (s. 3c), im sichtbaren HTML nie verwendet.
- **`.hero-bg-image:not(.active)`** und **`.hero-bg-image.inactive`** machen dasselbe (`opacity: 0`) – Überschneidung.
- **`.vision-card`** – definiert, im HTML nicht verwendet.
- **`styles.css` ↔ Inline-CSS:** kompletter Doppel-Satz an Basis-Regeln (`* {reset}`, `.container`, `.grid-2`, `--primary` usw.) in zwei konkurrierenden Designsystemen. Solange `styles.css` nicht eingebunden ist, „gewinnt" das Inline-CSS – verwirrend für künftige Änderungen.

### 3e. Bild-Format-Dopplungen

- **`P2`** liegt in **drei** Formaten vor (`.webp` 68 KB, `.png` 1,9 MB, `.jpeg` 130 KB) – genutzt wird nur `.webp`.
- **`W4`** liegt als `.jpeg` (1,3 MB) **und** `.webp` (190 KB) vor – genutzt wird die **große** `.jpeg`-Variante.

---

## 4. Performance – Ausgangswerte

**Hinweis:** Lighthouse konnte in dieser Umgebung **nicht** automatisch ausgeführt werden (Node.js ist im PATH nicht verfügbar, daher kein `npx lighthouse`). Statt geschätzter Zahlen hier eine **statische Analyse** mit konkreten Messpunkten – und unten eine Anleitung, wie du die echten Werte in 2 Minuten selbst bekommst.

### Statisch gemessen

| Posten | Wert | Bewertung |
|---|---|---|
| Beim Seitenstart geladene Bilder (Hero T1–T5 + P1 + P2.webp) | **~1,58 MB** | grenzwertig; T3.webp (217 KB) & P1.jpg (849 KB als og:image/Touch-Icon) stechen heraus |
| `vue.globals.js` | **574 KB** | großer, unminifizierter globaler Build; render-relevant |
| `marked.min.js` | 39 KB | komplett überflüssig (toter Code) |
| Modal-Bilder (erst bei Klick) | W1 900 KB, W2 702 KB, W3 849 KB, **W4 1,3 MB** | Lazy = gut; W4 nutzt aber die große JPEG statt der 190 KB-WebP |
| `index.html` | 1336 Zeilen, alles inline | CSS/JS nicht separat cachebar |

### Wichtigste Performance-Beobachtungen
1. **Vue (574 KB) blockiert im `<head>` ohne `defer`.** Da die App-Logik erst am Ende von `<body>` läuft, könnte das Script verzögert geladen werden.
2. **W4 im Modal lädt 1,3 MB statt 190 KB** – die WebP-Variante existiert bereits.
3. **P1.jpg (849 KB)** dient als `og:image` und `apple-touch-icon` – für ein Social-Vorschaubild zu groß.
4. **Alles inline in einer Datei** → Browser kann CSS/JS nicht getrennt zwischenspeichern; jede HTML-Änderung macht den gesamten Cache ungültig.

### So bekommst du die echten Lighthouse-Werte selbst (manuell)
**Variante A – Chrome DevTools (am einfachsten, kein Setup):**
1. Seite in Google Chrome öffnen (live oder lokal).
2. `F12` → Reiter **„Lighthouse"**.
3. Bei **Device** einmal **„Mobile"**, dann **„Desktop"** wählen → **„Analyze page load"**.
4. Notiere die vier Scores (Performance, Accessibility, Best Practices, SEO) + die Kennzahlen **LCP**, **TBT**, **CLS**.

**Variante B – CLI (wenn Node verfügbar ist):**
```bash
npm i -g lighthouse
lighthouse https://www.miki-hdh.de --preset=desktop --view
lighthouse https://www.miki-hdh.de --form-factor=mobile --view
```
> Trag die Ergebnisse danach gern hier in Abschnitt 4 ein, dann haben wir sie als Referenz.

---

## 5. Bonus-Fund außerhalb der Aufgabe (SEO)

**Domain-Mismatch:** `canonical` (Zeile 30) und `og:url` (Zeile 42) zeigen auf `https://miki-heidenheim.de/`, die echte Domain laut `CNAME` ist aber **`www.miki-hdh.de`**. Das kann dazu führen, dass Google die „falsche" (evtl. nicht erreichbare) Adresse als Hauptadresse wertet. Sollte angeglichen werden.

---

## 6. Zusammenfassung: Quick Wins vs. größere Eingriffe

### ✅ Quick Wins (geringes Risiko, schnell erledigt)
1. **Domain in `canonical` + `og:url` korrigieren** → `https://www.miki-hdh.de/` (SEO, 1 Zeile).
2. **`W4.jpeg` → `W4.webp`** im Baufortschritt-Modal tauschen (1,3 MB → 190 KB).
3. **Toten Blog-Code entfernen** (`posts`, `fetchPosts`, `fallbackMarkdown`, `marked`-Aufrufe) **und** `marked.min.js` aus dem `<head>` nehmen (−39 KB Request + −800 ms künstliche Verzögerung).
4. **Toten Foto-/Lightbox-Code entfernen** (`photos`, `currentPhoto`, `next/previousPhoto`, `openLightbox` + Lightbox-Markup).
5. **`styles.css` löschen** (nicht eingebunden).
6. **Ungenutzte Bilder löschen** (U1–U3, P2.png, P2.jpeg, P4.jpg, W4.webp-Dublette nach Punkt 2 anders herum, GochiHand) → Repo von ~42 MB auf ~3 MB.
7. **`defer` an die `<script>`-Tags** im `<head>`.
8. **Doppelte `.progress-item`-Regel** und tote `.blog-*`/`.vision-card`-Styles zusammenführen/entfernen.

→ Zusammen: deutlich schlankeres Repo, ein Netzwerk-Request weniger, sauberere Codebasis, **ohne** sichtbare Änderung für die Nutzer.

### 🔧 Größere Eingriffe (mehr Aufwand / Abwägung nötig)
1. **CSS & JS aus `index.html` auslagern** in `style.css` / `app.js` → getrennt cachebar, übersichtlicher. Abwägung: ein paar zusätzliche Requests vs. besseres Caching.
2. **Bild-Pipeline:** alle genutzten Fotos auf WebP + passende Auflösung bringen und `srcset` für Mobil/Desktop einsetzen (spart auf dem Handy spürbar Datenvolumen).
3. **Vue-Footprint reduzieren:** Statt des 574-KB-Global-Builds eine schlankere Variante prüfen (z. B. `petite-vue` ~6 KB) – die Seite nutzt nur einfache Bindings, `v-for`, `v-if` und Klick-Handler. Größerer Umbau, aber großer Gewinn.
4. **Pre-Rendering / statisches HTML** für Events & Baufortschritt erwägen, falls SEO der dynamischen Inhalte wichtiger wird (z. B. Inhalte direkt ins HTML schreiben statt nur in JS-Arrays).

---

*Erstellt als reine Bestandsaufnahme. Nächster sinnvoller Schritt: die Quick Wins 1–8 in einem Rutsch umsetzen – sie sind risikoarm und unabhängig voneinander.*
