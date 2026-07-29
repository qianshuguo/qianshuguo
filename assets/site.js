(function () {
    'use strict';

    var pageOrder = {
        'index.html': 0,
        'works.html': 1,
        'about.html': 2,
        'cv.html': 3,
        'contact.html': 4
    };
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var isNavigating = false;

    try {
        var pendingEntrance = window.sessionStorage.getItem('page-enter-direction');
        if (pendingEntrance) {
            document.documentElement.dataset.pageEnter = pendingEntrance;
            window.sessionStorage.removeItem('page-enter-direction');
        }
    } catch (error) {
        // Storage can be unavailable in privacy-restricted browsing contexts.
    }

    function pageName(url) {
        var parts = url.pathname.split('/');
        return parts[parts.length - 1] || 'index.html';
    }

    function transitionDirection(destination) {
        var currentPage = pageName(new URL(window.location.href));
        var nextPage = pageName(destination);

        if (nextPage === 'index.html' && currentPage !== 'index.html') {
            return { entrance: 'from-bottom', exit: 'to-top' };
        }

        if (pageOrder[currentPage] === undefined || pageOrder[nextPage] === undefined) {
            return { entrance: 'fade', exit: 'fade' };
        }

        if (pageOrder[nextPage] > pageOrder[currentPage]) {
            return { entrance: 'from-right', exit: 'to-left' };
        }

        return { entrance: 'from-left', exit: 'to-right' };
    }

    function isPlainLeftClick(event) {
        return event.button === 0 &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.shiftKey &&
            !event.altKey;
    }

    function shouldAnimateLink(link) {
        if (!link || !link.href || link.hasAttribute('download')) return false;
        if (link.target && link.target !== '_self') return false;

        var destination = new URL(link.href, window.location.href);
        if (destination.origin !== window.location.origin) return false;
        if (destination.protocol !== 'http:' && destination.protocol !== 'https:' && destination.protocol !== 'file:') return false;

        var current = new URL(window.location.href);
        return destination.pathname !== current.pathname ||
            destination.search !== current.search;
    }

    document.addEventListener('click', function (event) {
        if (!isPlainLeftClick(event) || event.defaultPrevented || isNavigating) return;

        var link = event.target.closest('a');
        if (!shouldAnimateLink(link) || reducedMotion.matches) return;

        event.preventDefault();
        isNavigating = true;
        var destination = new URL(link.href, window.location.href);
        var direction = transitionDirection(destination);

        document.body.dataset.pageExit = direction.exit;
        document.body.classList.add('is-leaving');

        try {
            window.sessionStorage.setItem('page-enter-direction', direction.entrance);
        } catch (error) {
            // The fade still works when storage is unavailable.
        }

        window.setTimeout(function () {
            window.location.assign(link.href);
        }, 200);
    });

    window.addEventListener('pageshow', function () {
        isNavigating = false;
        document.body.classList.remove('is-leaving');
        delete document.body.dataset.pageExit;
    });
}());
