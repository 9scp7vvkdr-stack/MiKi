/* MiKi-Homepage – Funktionen fuer alle Seiten.
   Grundsatz: Alle Inhalte stehen fest im HTML und funktionieren auch ohne JavaScript
   (Termin-Details und Fragen klappen dann einfach auf). Dieses Skript fuegt nur Extras hinzu:
   Pop-up-Fenster, Animationen, Parallax, abgelaufene Termine ausblenden, IBAN kopieren ...
   Bewusst in einfachem JavaScript (ES5) geschrieben, damit es auch auf alten Handys laeuft. */
(function () {
    'use strict';

    var doc = document;
    var root = doc.documentElement;
    var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var hasIO = 'IntersectionObserver' in window;

    // ------------------------------------------------------------ Hilfsfunktionen
    function all(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
    function matches(el, sel) {
        var fn = el.matches || el.msMatchesSelector || el.webkitMatchesSelector;
        return fn ? fn.call(el, sel) : false;
    }
    function closest(el, sel) {
        while (el && el.nodeType === 1) {
            if (matches(el, sel)) return el;
            el = el.parentNode;
        }
        return null;
    }
    function remove(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }
    // Eine Funktion darf scheitern, ohne die anderen mitzureissen
    function safe(fn) {
        try { fn(); } catch (e) { if (window.console && console.error) console.error(e); }
    }
    // Scroll-Handler hoechstens einmal pro Bild ausfuehren
    function onScrollFrame(fn) {
        var ticking = false;
        function run() { ticking = false; fn(); }
        function request() {
            if (!ticking) { ticking = true; window.requestAnimationFrame(run); }
        }
        window.addEventListener('scroll', request, { passive: true });
        window.addEventListener('resize', request);
        fn();
    }
    function scrollToEl(el) {
        if (!el) return;
        try { el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); }
        catch (e) { el.scrollIntoView(true); }
    }

    // ------------------------------------------------------------ Einblenden beim Scrollen
    // Elemente starten erst etwas unterhalb des Bildschirms, damit beim schnellen Scrollen
    // keine leeren Flaechen zu sehen sind. Ohne Unterstuetzung: alles sofort zeigen.
    function reveal() {
        var els = all('.hidden-el');
        if (!hasIO || reduceMotion) {
            els.forEach(function (el) { el.classList.add('show-el'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show-el');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px 25% 0px' });
        els.forEach(function (el) { io.observe(el); });
    }

    // ------------------------------------------------------------ Hintergrundbilder spaet laden
    // data-lazy-bg="Assets/..." wird erst kurz vor dem Sichtbarwerden geladen.
    function lazyBackgrounds() {
        var els = all('[data-lazy-bg]');
        function load(el) {
            el.style.backgroundImage = "url('" + el.getAttribute('data-lazy-bg') + "')";
            el.removeAttribute('data-lazy-bg');
        }
        if (!hasIO) { els.forEach(load); return; }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) { load(entry.target); io.unobserve(entry.target); }
            });
        }, { rootMargin: '400px 0px' });
        els.forEach(function (el) { io.observe(el); });
    }

    // ------------------------------------------------------------ Navigation
    // Markiert den Punkt, dessen Abschnitt gerade zu sehen ist (Abschnitte = Ziele der #-Links).
    function navHighlight() {
        var links = all('.navbar a[href^="#"]').filter(function (a) { return a.getAttribute('href').length > 1; });
        if (!links.length) return;
        var targets = links.map(function (a) { return doc.querySelector(a.getAttribute('href')); });
        onScrollFrame(function () {
            var pos = window.pageYOffset + 130;
            var current = -1, bestTop = -Infinity;
            targets.forEach(function (t, i) {
                if (!t) return;
                var top = t.getBoundingClientRect().top + window.pageYOffset;
                if (top <= pos && top > bestTop) { bestTop = top; current = i; }
            });
            links.forEach(function (a, i) {
                a.classList.toggle('active', i === current);
                if (i === current) a.setAttribute('aria-current', 'location');
                else a.removeAttribute('aria-current');
            });
        });
    }

    // ------------------------------------------------------------ Parallax + Scroll-Fortschritt
    // Erst alle Positionen lesen, dann alle Verschiebungen schreiben (fluessiger auf alten Handys).
    function parallax() {
        var bar = doc.querySelector('.scroll-progress');
        var hero = doc.querySelector('.hero');
        var heroBg = doc.querySelector('.hero-bg');
        var heroContent = doc.querySelector('.hero-content');
        // data-parallax="10": Element gleitet in seinem Rahmen um bis zu +/-10 % seiner Hoehe
        var media = all('[data-parallax]');
        // data-parallax-px="-60": Deko schwebt um bis zu +/-60 px gegen die Scrollrichtung
        var floaters = all('[data-parallax-px]');

        function progressOf(rect, vh) {
            // -1 = kommt unten rein, 0 = Mitte, 1 = verlaesst oben den Bildschirm
            var p = -(rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
            return Math.max(-1, Math.min(1, p));
        }

        onScrollFrame(function () {
            var y = window.pageYOffset;
            var vh = window.innerHeight;
            var max = doc.documentElement.scrollHeight - vh;
            if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
            if (reduceMotion) return;

            var reads = [];
            media.forEach(function (el) {
                var rect = el.parentNode.getBoundingClientRect();
                if (rect.bottom >= 0 && rect.top <= vh) reads.push([el, progressOf(rect, vh) * parseFloat(el.getAttribute('data-parallax')) + '%']);
            });
            floaters.forEach(function (el) {
                var rect = el.parentNode.getBoundingClientRect();
                if (rect.bottom >= 0 && rect.top <= vh) reads.push([el, progressOf(rect, vh) * parseFloat(el.getAttribute('data-parallax-px')) + 'px']);
            });
            var heroVisible = hero && heroBg && heroContent && y < hero.offsetHeight;

            reads.forEach(function (r) { r[0].style.transform = 'translate3d(0,' + r[1] + ',0)'; });
            if (heroVisible) {
                heroBg.style.transform = 'translate3d(0,' + (y * 0.4) + 'px,0)';
                heroContent.style.transform = 'translate3d(0,' + (y * 0.25) + 'px,0)';
                heroContent.style.opacity = Math.max(0, 1 - y / (vh * 0.75));
            }
        });
    }

    // ------------------------------------------------------------ Pop-up-Fenster
    // Inhalte stehen in <details data-modal> im HTML. Ohne JavaScript klappen sie einfach auf,
    // mit JavaScript erscheint der Inhalt (.modal-body) in einem Fenster.
    var modal = (function () {
        var overlay = null, lastFocus = null;

        function focusables(ctx) {
            return all('a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])', ctx)
                .filter(function (el) { return el.offsetWidth > 0 || el.offsetHeight > 0; });
        }
        function close() {
            if (!overlay) return;
            remove(overlay);
            overlay = null;
            doc.body.style.overflow = '';
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }
        function open(body, extraClass) {
            close();
            lastFocus = doc.activeElement;
            overlay = doc.createElement('div');
            overlay.className = 'modal-overlay';
            var box = doc.createElement('div');
            box.className = 'modal-content' + (extraClass ? ' ' + extraClass : '');
            box.setAttribute('role', 'dialog');
            box.setAttribute('aria-modal', 'true');
            var btn = doc.createElement('button');
            btn.type = 'button';
            btn.className = 'modal-close';
            btn.setAttribute('aria-label', 'Schließen');
            btn.innerHTML = '<i class="ph ph-x" aria-hidden="true"></i>';
            box.appendChild(btn);
            box.appendChild(body);
            var title = box.querySelector('h2, h3');
            if (title) { title.id = 'modal-titel'; box.setAttribute('aria-labelledby', 'modal-titel'); }
            overlay.appendChild(box);
            doc.body.appendChild(overlay);
            // Solange das Fenster offen ist, scrollt die Seite dahinter nicht mit
            doc.body.style.overflow = 'hidden';

            overlay.addEventListener('click', function (e) {
                if (e.target === overlay || closest(e.target, '.modal-close, [data-close]')) { close(); return; }
                // Sprung-Links innerhalb der Seite: erst Fenster schliessen, dann springen
                var a = closest(e.target, 'a[href^="#"]');
                if (a) {
                    e.preventDefault();
                    var target = doc.querySelector(a.getAttribute('href'));
                    close();
                    scrollToEl(target);
                }
            });
            btn.focus();
        }
        doc.addEventListener('keydown', function (e) {
            if (!overlay) return;
            if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) { close(); return; }
            // Tab-Taste bleibt im Fenster
            if (e.key === 'Tab' || e.keyCode === 9) {
                var f = focusables(overlay);
                if (!f.length) return;
                var first = f[0], last = f[f.length - 1];
                if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        });
        return { open: open, close: close };
    })();

    function modalDetails() {
        all('details[data-modal]').forEach(function (details) {
            var summary = details.querySelector('summary');
            var body = details.querySelector('.modal-body');
            if (!summary || !body) return;
            summary.setAttribute('aria-haspopup', 'dialog');
            summary.addEventListener('click', function (e) {
                e.preventDefault();
                var copy = body.cloneNode(true);
                // Bilder im Fenster sofort laden
                all('img[loading="lazy"]', copy).forEach(function (img) { img.removeAttribute('loading'); });
                modal.open(copy, details.getAttribute('data-modal'));
            });
        });
        // Ganze Karte anklickbar (data-card); Links und Buttons darin behalten ihre Funktion
        doc.addEventListener('click', function (e) {
            var card = closest(e.target, '[data-card]');
            if (!card || closest(e.target, 'a, button, summary')) return;
            var summary = card.querySelector('details[data-modal] > summary');
            if (summary) summary.click();
        });
    }

    // ------------------------------------------------------------ Termine
    // data-end:   Element verschwindet nach diesem Zeitpunkt (einmalige Events)
    // data-until: Hinweis verschwindet ab diesem Zeitpunkt (z. B. "Start am 13.11.")
    // data-hide-if-empty=".x": Bereich verschwindet, wenn darin kein .x mehr steht
    function timeBased() {
        var now = new Date().getTime();
        all('[data-end]').forEach(function (el) {
            var t = Date.parse(el.getAttribute('data-end'));
            if (!isNaN(t) && now > t) remove(el);
        });
        all('[data-until]').forEach(function (el) {
            var t = Date.parse(el.getAttribute('data-until'));
            if (!isNaN(t) && now >= t) remove(el);
        });
        all('[data-hide-if-empty]').forEach(function (el) {
            if (!el.querySelector(el.getAttribute('data-hide-if-empty'))) remove(el);
        });
    }

    // Fuer Google: kommende Highlights als "Event" auszeichnen (erscheinen ggf. in der Event-Suche).
    // Die Daten kommen direkt aus den Karten, damit nichts doppelt gepflegt werden muss.
    function eventData() {
        var cards = all('.highlight-card[data-start]');
        if (!cards.length) return;
        var data = cards.map(function (card) {
            var title = card.querySelector('h3');
            var desc = card.querySelector('.modal-body p');
            var item = {
                '@context': 'https://schema.org',
                '@type': 'Event',
                name: title ? title.textContent.trim() : '',
                description: desc ? desc.textContent.trim() : '',
                startDate: card.getAttribute('data-start'),
                endDate: card.getAttribute('data-end') || undefined,
                eventStatus: 'https://schema.org/EventScheduled',
                eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
                isAccessibleForFree: true,
                location: {
                    '@type': 'Place',
                    name: 'MiKi (Michaelskirche)',
                    address: { '@type': 'PostalAddress', streetAddress: 'An der Stadtmauer 1', addressLocality: 'Heidenheim an der Brenz', postalCode: '89520', addressCountry: 'DE' }
                },
                organizer: { '@type': 'Organization', name: 'MiKi – Jugendkirche Heidenheim', url: 'https://www.miki-hdh.de/' }
            };
            if (card.getAttribute('data-image')) item.image = ['https://www.miki-hdh.de/' + card.getAttribute('data-image')];
            return item;
        });
        var sc = doc.createElement('script');
        sc.type = 'application/ld+json';
        sc.text = JSON.stringify(data);
        doc.head.appendChild(sc);
    }

    // Pfeile zum Blaettern, sobald nicht alle Termine in eine Reihe passen (Computer)
    function eventArrows() {
        var grid = doc.querySelector('.events-grid');
        var nav = doc.querySelector('.events-nav');
        if (!grid || !nav) return;
        var buttons = all('.events-arrow', nav);
        function update() {
            var max = grid.scrollWidth - grid.clientWidth;
            nav.classList.toggle('show', max > 4);
            buttons[0].disabled = grid.scrollLeft <= 4;
            buttons[1].disabled = grid.scrollLeft >= max - 4;
        }
        buttons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var card = grid.querySelector('.event-card');
                var step = card ? card.offsetWidth + 20 : grid.clientWidth;
                var left = step * Number(btn.getAttribute('data-dir'));
                try { grid.scrollBy({ left: left, behavior: reduceMotion ? 'auto' : 'smooth' }); }
                catch (e) { grid.scrollLeft += left; }
            });
        });
        grid.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    }

    // ------------------------------------------------------------ Titelbild
    // Slideshow: zufaellige Reihenfolge, Wechsel alle 4,5 s. Es wird immer nur das NAECHSTE Foto
    // vorgeladen (spart mobile Daten). Bei "Bewegung reduzieren" bleibt das erste Foto stehen.
    function heroCarousel() {
        var images = all('.hero-bg-image');
        if (images.length < 2 || reduceMotion) return;
        function load(img) {
            var src = img && img.getAttribute('data-bg');
            if (src) { img.style.backgroundImage = "url('" + src + "')"; img.removeAttribute('data-bg'); }
        }
        // Erstes (schon sichtbares) Foto bleibt vorne, der Rest wird gemischt
        var first = images.shift();
        for (var i = images.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = images[i]; images[i] = images[j]; images[j] = tmp;
        }
        var order = [first].concat(images);
        var current = 0;
        function preloadNext() { load(order[(current + 1) % order.length]); }
        if (doc.readyState === 'complete') preloadNext();
        else window.addEventListener('load', preloadNext);

        setInterval(function () {
            // Pause, wenn das Titelbild nicht zu sehen ist (weggescrollt oder Tab im Hintergrund)
            if (doc.hidden || window.pageYOffset > window.innerHeight) return;
            var next = (current + 1) % order.length;
            load(order[next]);
            order[current].classList.remove('active');
            order[next].classList.add('active');
            current = next;
            preloadNext();
        }, 4500);
    }

    // Wechselwort im Titelbild ("Deine Kirche zum ...")
    function rotator() {
        var el = doc.getElementById('rot-word');
        if (!el || reduceMotion) return;
        var words = (el.getAttribute('data-words') || '').split(',');
        if (words.length < 2) return;
        var i = 0;
        setInterval(function () {
            i = (i + 1) % words.length;
            el.textContent = words[i];
            el.classList.remove('rot-in');
            void el.offsetWidth; // Animation neu starten
            el.classList.add('rot-in');
        }, 2400);
    }

    // ------------------------------------------------------------ Über die MiKi
    // Fortschrittsbalken zaehlen beim Reinscrollen hoch. Ohne JavaScript stehen die Endwerte da.
    function progressBars() {
        var items = all('.progress-item');
        if (!items.length || !hasIO || reduceMotion) return;
        items.forEach(function (item) {
            var fill = item.querySelector('.progress-bar-fill');
            var circle = item.querySelector('.progress-circle');
            if (fill) fill.style.width = '0%';
            if (circle) circle.textContent = '0%';
        });
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                io.unobserve(entry.target);
                var fill = entry.target.querySelector('.progress-bar-fill');
                var circle = entry.target.querySelector('.progress-circle');
                var target = parseInt(circle ? circle.getAttribute('data-percent') : '0', 10) || 0;
                if (fill) fill.style.width = target + '%';
                if (!circle) return;
                var step = 0;
                var timer = setInterval(function () {
                    step++;
                    var value = Math.round(target * step / 30);
                    circle.textContent = value + '%';
                    if (step >= 30) clearInterval(timer);
                }, 20);
            });
        }, { threshold: 0.5 });
        items.forEach(function (item) { io.observe(item); });
    }

    // Logo-Laufband: Die Logos stehen einmal im HTML. Fuer die Endlos-Schleife werden sie hier
    // vervielfaeltigt. Ohne JavaScript (oder bei "Bewegung reduzieren") stehen sie still.
    function logoMarquee() {
        var marquee = doc.querySelector('.logo-marquee');
        var track = marquee && marquee.querySelector('.logo-track');
        var group = track && track.querySelector('.logo-group');
        if (!group || reduceMotion) return;
        for (var i = 0; i < 5; i++) {
            var copy = group.cloneNode(true);
            copy.setAttribute('aria-hidden', 'true');
            all('img', copy).forEach(function (img) { img.alt = ''; });
            track.appendChild(copy);
        }
        marquee.classList.add('is-running');
    }

    // IBAN in die Zwischenablage (ohne Leerzeichen, so akzeptieren es alle Banking-Apps)
    function copyIban() {
        all('[data-copy]').forEach(function (btn) {
            var label = btn.querySelector('.copy-label');
            var icon = btn.querySelector('i');
            btn.hidden = false;
            btn.addEventListener('click', function () {
                var text = btn.getAttribute('data-copy');
                function done() {
                    if (label) label.textContent = 'Kopiert!';
                    if (icon) icon.className = 'ph ph-check';
                    setTimeout(function () {
                        if (label) label.textContent = 'Kopieren';
                        if (icon) icon.className = 'ph ph-copy';
                    }, 2000);
                }
                function fallback() {
                    var t = doc.createElement('textarea');
                    t.value = text;
                    t.setAttribute('readonly', '');
                    t.style.position = 'absolute';
                    t.style.left = '-9999px';
                    doc.body.appendChild(t);
                    t.select();
                    try { doc.execCommand('copy'); } catch (e) { /* nichts */ }
                    remove(t);
                    done();
                }
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(done, fallback);
                } else {
                    fallback();
                }
            });
        });
    }

    function footerYear() {
        var el = doc.getElementById('footer-year');
        if (el) el.textContent = new Date().getFullYear();
    }

    // ------------------------------------------------------------ Start
    function init() {
        // Einblenden zuerst; scheitert es, wird alles normal angezeigt
        try { reveal(); } catch (e) { root.className = root.className.replace(/\bjs\b/, ''); }
        safe(timeBased);
        safe(eventData);
        safe(modalDetails);
        safe(eventArrows);
        safe(lazyBackgrounds);
        safe(navHighlight);
        safe(parallax);
        safe(heroCarousel);
        safe(rotator);
        safe(progressBars);
        safe(logoMarquee);
        safe(copyIban);
        safe(footerYear);
        window.MiKiSite = { ready: true };
    }

    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
    else init();
})();
