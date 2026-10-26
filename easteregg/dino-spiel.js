/* EASTEREGG: Dino-Spiel "Fang mich!" zum Start der Open Church am 13.11.2026
   Wird erst geladen, wenn jemand im Open-Church-Fenster auf "Freigetraenk gewinnen?!" tippt
   (gestartet aus index.html mit MiKiDinoSpiel.start({ confetti })).
   Entfernen: diesen Ordner loeschen und in index.html alle Stellen mit "EASTEREGG" entfernen.

   Ablauf: Dino skatet rein, "Fang mich!", "3 – 2 – 1 – Los geht's!", dann flitzt er mehrmals
   ueber den Bildschirm. Antippen = gewonnen (Konfetti + Gutschein zum Screenshotten).
   Nicht erwischt = "Knapp daneben! Nochmal?" - jede neue Runde ist etwas langsamer. */
(() => {
    // Kopie von Assets/skaterdino-animiert.svg: doppelt so schnell, Raeder auf dunklem Grund sichtbar
    const DINO_SRC = 'easteregg/skaterdino-spiel.svg';
    const PASSES = 4;               // so oft flitzt der Dino pro Runde ueber den Bildschirm
    const SLOWER_PER_TRY = 1.2;     // jede neue Runde 20 % langsamer, damit es jeder schafft
    const PHONE_CROSS_MS = 700;     // Handy: Millisekunden fuer einmal ganz quer (kleiner = schneller)
    const BIG_CROSS_MS = 1300;      // Tablet/PC: Millisekunden fuer einmal ganz quer (kleiner = schneller)
    // Code auf dem Gutschein: Fangzeit in Hundertstel + 3 Zufallsbuchstaben, z. B. 247-KXT.
    // Gleicher Code zweimal = geteilter Screenshot. Buchstaben ohne Verwechsler wie O/0 oder I/1.
    const CODE_LETTERS = 'ACDEFHJKMNPRTUVWXY';

    const CSS = `
.dg { position: fixed; inset: 0; z-index: 1050; overflow: hidden; background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(4px); -webkit-user-select: none; user-select: none; touch-action: manipulation;
      animation: dgFade 0.25s ease; }
.dg [hidden] { display: none !important; }
.dg-close { position: absolute; top: 14px; right: 14px; z-index: 3; width: 44px; height: 44px; border: none;
            border-radius: 50%; background: rgba(255, 255, 255, 0.14); color: #fff; font-size: 1.25rem; cursor: pointer; }
.dg-close:hover { background: rgba(255, 255, 255, 0.25); }
.dg-dino { position: absolute; left: 0; top: 0; z-index: 2; width: clamp(140px, 24vw, 230px); padding: 0; border: none;
           background: none; cursor: pointer; -webkit-tap-highlight-color: transparent; will-change: transform; }
.dg-dino img { display: block; width: 100%; height: auto; border-radius: 0; pointer-events: none; }
.dg-dino.dg-left img { transform: scaleX(-1); }
.dg-bubble { position: absolute; left: 50%; bottom: calc(100% + 4px); transform: translateX(-50%); white-space: nowrap;
             padding: 8px 20px; border-radius: 18px; background: #fff; color: var(--dark);
             font-family: var(--font-head); font-size: 2rem; line-height: 1.1; box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5); }
.dg-bubble::after, .dg-say::after { content: ''; position: absolute; left: 50%; top: 100%; transform: translateX(-50%);
             border: 9px solid transparent; border-top-color: #fff; }
.dg-bubble:empty { display: none; }
.dg-pop { animation: dgPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.dg-panel { position: absolute; inset: 0; z-index: 2; display: flex; padding: 68px 16px 20px; overflow-y: auto; }
.dg-card { width: 100%; max-width: 420px; margin: auto; text-align: center; animation: dgFade 0.35s ease; }
.dg-say { position: relative; padding: 14px 18px; border-radius: 18px; background: #fff; color: var(--dark);
          font-weight: 700; line-height: 1.45; }
.dg-card-dino { display: block; width: 150px; height: auto; margin: 12px auto 4px; border-radius: 0; }
/* Kleine Bildschirme: alles etwas kompakter, damit der ganze Gutschein in einen Screenshot passt */
@media (max-height: 820px) {
    .dg-panel { padding-top: 64px; }
    .dg-card-dino { width: 90px; margin-top: 6px; }
    .dg-voucher { padding: 14px 14px 12px; }
    .dg-v-title { font-size: 2.2rem; margin-bottom: 6px; }
    .dg-v-code { margin-top: 10px; padding: 6px 10px; }
    .dg-v-code strong { font-size: 1.2rem; }
    .dg-v-note { margin-top: 8px; padding-top: 8px; }
    .dg-outro { margin: 14px 0 12px; }
}
@media (max-height: 640px) {
    .dg-card-dino { display: none; }
    .dg-say { margin-bottom: 14px; padding: 10px 14px; font-size: 0.9rem; }
    .dg-say::after { display: none; }
}
.dg-voucher { position: relative; padding: 18px 18px 16px; border-radius: 20px; background: #fff; color: var(--dark);
              border: 3px dashed var(--primary); box-shadow: 0 0 40px rgba(16, 187, 130, 0.35); }
.dg-v-kicker { display: inline-flex; align-items: center; gap: 6px; color: var(--primary-ink); font-size: 0.78rem;
               font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
.dg-v-kicker i { font-size: 1.1rem; }
.dg-v-title { display: block; margin: 2px 0 8px; font-family: var(--font-head); font-size: 2.6rem; font-weight: 400; line-height: 1; }
.dg-v-line { display: block; font-size: 0.92rem; line-height: 1.5; }
.dg-v-code { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 4px 10px; margin-top: 12px;
             padding: 8px 12px; border-radius: 12px; background: rgba(16, 187, 130, 0.12); font-size: 0.85rem; }
.dg-v-code strong { font-size: 1.35rem; letter-spacing: 0.12em; }
.dg-v-note { display: block; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0; color: var(--muted); font-size: 0.8rem; }
.dg-outro { margin: 18px 0 16px; color: rgba(255, 255, 255, 0.92); line-height: 1.6; }
.dg .btn { width: 100%; justify-content: center; }
@keyframes dgFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes dgPop { from { opacity: 0; transform: translateX(-50%) scale(0.6); } to { opacity: 1; transform: translateX(-50%) scale(1); } }
`;

    const winHtml = (time, code) => `
<div class="dg-card">
    <p class="dg-say">Herzlichen Glückwunsch! Screenshotte den Gutschein und zeig ihn am 13. November bei der Open Church.</p>
    <img class="dg-card-dino" src="${DINO_SRC}" width="670" height="430" alt="">
    <div class="dg-voucher">
        <span class="dg-v-kicker"><i class="ph ph-ticket" aria-hidden="true"></i> Gutschein</span>
        <strong class="dg-v-title">1 Freigetränk</strong>
        <span class="dg-v-line">Open Church · Freitag, 13.11.2026</span>
        <span class="dg-v-line">12:00–16:30 Uhr</span>
        <span class="dg-v-line">MiKi · Michaelskirche Heidenheim</span>
        <span class="dg-v-code"><span>Gefangen in ${time} s · Code</span><strong>${code}</strong></span>
        <span class="dg-v-note">1 Freigetränk pro Person · Jeder Code gilt nur einmal</span>
    </div>
    <p class="dg-outro">Willst du mehr über die MiKi wissen? Dann schau dich gerne noch hier auf der Seite um. Ansonsten: bis Freitag!</p>
    <button type="button" class="btn btn-glow dg-action">Zurück zur Seite</button>
</div>`;

    const MISS_HTML = `
<div class="dg-card">
    <p class="dg-say">Knapp daneben! Nochmal?</p>
    <img class="dg-card-dino" src="${DINO_SRC}" width="670" height="430" alt="">
    <button type="button" class="btn btn-glow dg-action" style="margin-top: 16px;">Nochmal versuchen</button>
</div>`;

    let root = null, dino = null, bubble = null, panel = null;
    let confettiFn = null;
    let anim = null;        // laufende Bewegung des Dinos
    let phase = '';         // 'intro' | 'hunt' | 'won' | 'missed'
    let tries = 0;
    let huntStart = 0;      // Zeitpunkt von "Los geht's!" (fuer die Fangzeit)
    let run = 0;            // zaehlt hoch bei Neustart/Schliessen, damit alte Ablaeufe abbrechen

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function say(text) {
        bubble.textContent = text;
        bubble.classList.remove('dg-pop');
        void bubble.offsetWidth;  // Animation neu starten
        if (text) bubble.classList.add('dg-pop');
    }

    // Dino von a nach b bewegen; blickt nach links, wenn er nach links faehrt
    function move(a, b, duration, easing) {
        if (anim) anim.cancel();
        dino.classList.toggle('dg-left', b.x < a.x);
        dino.style.transform = `translate(${b.x}px, ${b.y}px)`;
        anim = dino.animate([
            { transform: `translate(${a.x}px, ${a.y}px)` },
            { transform: `translate(${b.x}px, ${b.y}px)` }
        ], { duration, easing });
        return anim.finished.catch(() => {});
    }

    async function round(withIntro) {
        const id = ++run;
        const alive = () => id === run && root && phase !== 'won';
        phase = 'intro';
        panel.hidden = true;
        panel.innerHTML = '';
        dino.hidden = false;
        say('');

        const w = window.innerWidth, h = window.innerHeight;
        const dw = dino.offsetWidth, dh = dino.offsetHeight;
        const offLeft = -dw - 20, offRight = w + 20;
        const randomY = () => 70 + Math.random() * Math.max(0, h - dh - 150);
        const center = { x: (w - dw) / 2, y: h * 0.58 - dh / 2 };

        // reinskaten, "Fang mich!", Countdown
        await move({ x: offLeft, y: center.y }, center, withIntro ? 1100 : 700, 'cubic-bezier(0.2, 0.8, 0.3, 1)');
        if (!alive()) return;
        const lines = withIntro ? ['Fang mich!', '3', '2', '1', 'Los geht’s!'] : ['3', '2', '1', 'Los geht’s!'];
        for (const text of lines) {
            say(text);
            await wait(text === 'Fang mich!' ? 1500 : 750);
            if (!alive()) return;
        }
        say('');

        // Jagd: mehrmals quer ueber den Bildschirm, abwechselnd nach rechts und links
        phase = 'hunt';
        dino.focus({ preventScroll: true });
        const slow = Math.pow(SLOWER_PER_TRY, tries) * (reducedMotion() ? 2 : 1);
        const crossTime = (w < 600 ? PHONE_CROSS_MS : BIG_CROSS_MS) * slow;
        huntStart = performance.now();
        let from = center;
        for (let i = 0; i < PASSES; i++) {
            const toRight = i % 2 === 0;
            if (i > 0) from = { x: toRight ? offLeft : offRight, y: randomY() };
            const to = { x: toRight ? offRight : offLeft, y: randomY() };
            const share = Math.abs(to.x - from.x) / (w + dw + 40);
            await move(from, to, crossTime * share * (0.9 + Math.random() * 0.2), 'linear');
            if (!alive()) return;
            await wait(250 + Math.random() * 350);
            if (!alive()) return;
        }

        tries++;
        phase = 'missed';
        showCard(MISS_HTML, () => round(false));
    }

    async function caught() {
        if (phase !== 'hunt') return;
        phase = 'won';
        const centis = Math.max(1, Math.round((performance.now() - huntStart) / 10));
        let letters = '';
        for (let i = 0; i < 3; i++) letters += CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)];
        const time = (centis / 100).toFixed(2).replace('.', ',');
        // Dino dort anhalten, wo er gerade ist
        const pos = new DOMMatrixReadOnly(getComputedStyle(dino).transform);
        if (anim) anim.cancel();
        dino.style.transform = `translate(${pos.e}px, ${pos.f}px)`;
        const r = dino.getBoundingClientRect();
        if (confettiFn) confettiFn(r.left + r.width / 2, r.top + r.height / 2);
        const id = run;
        await wait(700);
        if (id !== run || !root) return;
        showCard(winHtml(time, centis + '-' + letters), close);
    }

    function showCard(html, onAction) {
        dino.hidden = true;
        panel.innerHTML = html;
        panel.hidden = false;
        panel.scrollTop = 0;
        const btn = panel.querySelector('.dg-action');
        btn.addEventListener('click', onAction);
        btn.focus({ preventScroll: true });
    }

    function onKey(e) {
        if (e.key === 'Escape') close();
    }

    function close() {
        if (!root) return;
        run++;
        if (anim) anim.cancel();
        document.removeEventListener('keydown', onKey);
        root.remove();
        root = dino = bubble = panel = null;
        document.body.style.overflow = '';
    }

    function start(opts) {
        if (root) return;
        confettiFn = opts && opts.confetti;
        if (!document.getElementById('dg-style')) {
            const style = document.createElement('style');
            style.id = 'dg-style';
            style.textContent = CSS;
            document.head.appendChild(style);
        }

        root = document.createElement('div');
        root.className = 'dg';
        root.setAttribute('role', 'dialog');
        root.setAttribute('aria-modal', 'true');
        root.setAttribute('aria-label', 'Fang den Dino');
        root.innerHTML = `
<button type="button" class="dg-close" aria-label="Spiel schließen">✕</button>
<button type="button" class="dg-dino" aria-label="Dino fangen" style="transform: translate(-9999px, 0);">
    <span class="dg-bubble" aria-live="polite"></span>
    <img src="${DINO_SRC}" width="670" height="430" alt="" draggable="false">
</button>
<div class="dg-panel" hidden></div>`;
        dino = root.querySelector('.dg-dino');
        bubble = root.querySelector('.dg-bubble');
        panel = root.querySelector('.dg-panel');
        root.querySelector('.dg-close').addEventListener('click', close);
        // pointerdown reagiert am Handy sofort, click deckt Tastatur (Enter) ab
        dino.addEventListener('pointerdown', caught);
        dino.addEventListener('click', caught);
        document.addEventListener('keydown', onKey);
        document.body.appendChild(root);
        document.body.style.overflow = 'hidden';

        tries = 0;
        phase = '';
        // erst loslegen, wenn das Dino-Bild geladen ist
        const img = dino.querySelector('img');
        (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => { if (root) round(true); });
    }

    window.MiKiDinoSpiel = { start };
})();
