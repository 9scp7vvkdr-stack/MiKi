/* MiKi-Homepage – gemeinsame Funktionen fuer alle Seiten.
   Seiten mit Vue rufen MiKiSite.init() erst NACH dem Mount auf, weil Vue die
   Elemente in #app beim Start neu erzeugt. Seiten ohne Vue rufen es direkt auf. */
(function () {
    'use strict';

    // Bewegung nur, wenn der Nutzer sie nicht im System abgeschaltet hat
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Inhalte beim Scrollen sanft einblenden
    function reveal() {
        var els = document.querySelectorAll('.hidden-el');
        if (!('IntersectionObserver' in window)) {
            els.forEach(function (el) { el.classList.add('show-el'); });
            return;
        }
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show-el');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        els.forEach(function (el) { observer.observe(el); });
    }

    // Navigation: markiert den Punkt, dessen Abschnitt gerade zu sehen ist.
    // Die Abschnitte ergeben sich automatisch aus den Links (href="#...").
    function navHighlight() {
        var links = Array.prototype.slice.call(document.querySelectorAll('.navbar a[href^="#"]'))
            .filter(function (a) { return a.getAttribute('href').length > 1; });
        var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
        if (!links.length) return;
        var ticking = false;
        function update() {
            ticking = false;
            var pos = window.scrollY + 130;
            var current = -1, bestTop = -Infinity;
            targets.forEach(function (t, i) {
                if (!t) return;
                var top = t.getBoundingClientRect().top + window.scrollY;
                if (top <= pos && top > bestTop) { bestTop = top; current = i; }
            });
            links.forEach(function (a, i) { a.classList.toggle('active', i === current); });
        }
        window.addEventListener('scroll', function () {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        }, { passive: true });
        update();
    }

    // Parallax + Scroll-Fortschritt: bewegt nur transform, rechnet hoechstens einmal pro Frame
    function parallax() {
        var bar = document.querySelector('.scroll-progress');
        var hero = document.querySelector('.hero');
        var heroBg = document.querySelector('.hero-bg');
        var heroContent = document.querySelector('.hero-content');
        // data-parallax="10": Element gleitet innerhalb seines Rahmens um bis zu +/-10 % seiner Hoehe
        var media = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
        // data-parallax-px="-60": Deko schwebt um bis zu +/-60 px gegen die Scrollrichtung
        var floaters = Array.prototype.slice.call(document.querySelectorAll('[data-parallax-px]'));
        var ticking = false;

        function progressOf(rect, vh) {
            // -1 = Element kommt gerade unten rein, 0 = Mitte, 1 = verlaesst oben den Viewport
            return -(rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
        }

        function update() {
            ticking = false;
            var y = window.scrollY;
            var vh = window.innerHeight;
            var max = document.documentElement.scrollHeight - vh;
            if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
            if (reduceMotion) return;

            if (hero && heroBg && heroContent && y < hero.offsetHeight) {
                heroBg.style.transform = 'translate3d(0,' + (y * 0.4) + 'px,0)';
                heroContent.style.transform = 'translate3d(0,' + (y * 0.25) + 'px,0)';
                heroContent.style.opacity = Math.max(0, 1 - y / (vh * 0.75));
            }

            media.forEach(function (el) {
                var rect = el.parentElement.getBoundingClientRect();
                if (rect.bottom < 0 || rect.top > vh) return;
                var p = Math.max(-1, Math.min(1, progressOf(rect, vh)));
                el.style.transform = 'translate3d(0,' + (p * parseFloat(el.dataset.parallax)) + '%,0)';
            });

            floaters.forEach(function (el) {
                var rect = el.parentElement.getBoundingClientRect();
                if (rect.bottom < 0 || rect.top > vh) return;
                var p = Math.max(-1, Math.min(1, progressOf(rect, vh)));
                el.style.transform = 'translate3d(0,' + (p * parseFloat(el.dataset.parallaxPx)) + 'px,0)';
            });
        }

        function onScroll() {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        update();
    }

    // Hintergrundbilder spaet laden: data-lazy-bg="Assets/..." wird erst kurz vor dem
    // Sichtbarwerden geladen (spart beim ersten Aufruf Daten, v. a. am Handy)
    function lazyBackgrounds() {
        var els = Array.prototype.slice.call(document.querySelectorAll('[data-lazy-bg]'));
        function load(el) {
            el.style.backgroundImage = "url('" + el.getAttribute('data-lazy-bg') + "')";
            el.removeAttribute('data-lazy-bg');
        }
        if (!('IntersectionObserver' in window)) { els.forEach(load); return; }
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) { load(entry.target); observer.unobserve(entry.target); }
            });
        }, { rootMargin: '600px 0px' });
        els.forEach(function (el) { observer.observe(el); });
    }

    function footerYear() {
        var el = document.getElementById('footer-year');
        if (el) el.textContent = new Date().getFullYear();
    }

    window.MiKiSite = {
        reduceMotion: reduceMotion,
        init: function () {
            reveal();
            navHighlight();
            parallax();
            lazyBackgrounds();
            footerYear();
        }
    };
})();
