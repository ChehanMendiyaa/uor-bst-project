// ========================================
// DIGITAL BOOK / DOCUMENT VIEWER
// ========================================

const book = document.getElementById("book");
const bookStage = document.getElementById("bookStage");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const zoomBtn = document.getElementById("zoomBtn");

const indicator = document.getElementById("pageIndicator");
const dots = document.getElementById("pageDots");
const magTitle = document.getElementById("magTitle");
const progressCurrent = document.getElementById("progressCurrent");
const progressTotal = document.getElementById("progressTotal");

if (fullscreenBtn) {
    fullscreenBtn.innerHTML = '<span aria-hidden="true">⛶</span><b>Full screen</b>';
    fullscreenBtn.classList.add("fullscreen-button");
    fullscreenBtn.setAttribute("aria-label", "Open full screen");
}

// ========================================
// CREATE DOCUMENT PAGES DYNAMICALLY
// ========================================

if (book && window.DOCUMENT_PAGE_COUNT) {
    // Remove existing pages
    book.querySelectorAll(".page").forEach((page) => {
        page.remove();
    });

    // Create document pages
    for (let i = 1; i <= window.DOCUMENT_PAGE_COUNT; i++) {
        const page = document.createElement("article");

        page.className = "page document-page";

        page.style.backgroundImage = `
            url("assets/document-pages/page-${String(i).padStart(2, "0")}.png"),
            url("assets/backgrounds/paper-texture.jpg")
        `;

        page.setAttribute("aria-label", `Document page ${i}`);

        book.appendChild(page);
    }

    // Update title
    if (magTitle) {
        magTitle.textContent = "Updated all in one";
    }
}

// ========================================
// PAGE VARIABLES
// ========================================

let pages = book
    ? [...book.querySelectorAll(".page")]
    : [];

let current = 0;
let busy = false;
let touchStart = 0;

// ========================================
// SHOW PAGE
// ========================================

function show(index) {
    if (!pages.length) return;

    pages.forEach((page, i) => {
        page.classList.toggle(
            "page-visible",
            i === index
        );
    });

    if (bookStage) {
        bookStage.classList.add("is-ready");
        bookStage.setAttribute(
            "aria-busy",
            "false"
        );
    }
}

// ========================================
// UPDATE NAVIGATION
// ========================================

function update() {
    if (!pages.length) return;

    // Previous button
    if (prevBtn) {
        prevBtn.disabled = current === 0;
    }

    // Next button
    if (nextBtn) {
        nextBtn.disabled =
            current === pages.length - 1;
    }

    // Page indicator
    if (indicator) {
        indicator.textContent =
            current === 0
                ? "Cover"
                : `Page ${String(current).padStart(
                      2,
                      "0"
                  )} / ${String(
                      pages.length - 1
                  ).padStart(2, "0")}`;
    }

    if (progressCurrent) progressCurrent.textContent = String(current + 1).padStart(2, "0");
    if (progressTotal) progressTotal.textContent = String(pages.length).padStart(2, "0");

    // Navigation dots
    if (dots) {
        dots.innerHTML = "";

        const dotCount = Math.min(pages.length, 9);
        for (let dotIndex = 0; dotIndex < dotCount; dotIndex += 1) {
            const index = Math.round(dotIndex * (pages.length - 1) / Math.max(dotCount - 1, 1));
            const dot =
                document.createElement("button");

            dot.type = "button";

            const segmentStart = Math.round(dotIndex * pages.length / dotCount);
            const segmentEnd = Math.round((dotIndex + 1) * pages.length / dotCount) - 1;
            dot.className = current >= segmentStart && current <= segmentEnd ? "active" : "";

            dot.setAttribute(
                "aria-label",
                `Go to page ${index + 1}`
            );

            dot.setAttribute(
                "aria-current",
                index === current
                    ? "true"
                    : "false"
            );

            dot.addEventListener(
                "click",
                () => go(index)
            );

            dots.appendChild(dot);
        }
    }
}

// ========================================
// GO TO PAGE
// ========================================
//
// A single "sheet" (a disposable clone of a real page) is what
// physically rotates in 3D. Its content always matches whichever
// page state is true at the START of its rotation and, more
// importantly, at the END of it, so the moment it's removed the
// underlying book never visibly changes — no flash, no jump.
//
// Forward (Next): the OUTGOING page (current) is the one turning
// away, so it's cloned. The real target page is swapped in
// underneath right away; the sheet covers it and rotates off to
// reveal it, matching the "page lifts off the stack" motion.
//
// Backward (Prev): the INCOMING page (target) is the one turning
// back into place, so it's cloned instead. The real page swap is
// deferred until the sheet has finished rotating back to 0deg —
// at that exact frame the sheet (showing target) and the real page
// (about to become target) are identical, so swapping is invisible.

function go(target) {
    // Prevent invalid navigation
    if (
        busy ||
        target < 0 ||
        target >= pages.length ||
        target === current
    ) {
        return;
    }

    busy = true;

    if (bookStage) {
        bookStage.setAttribute(
            "aria-busy",
            "true"
        );
    }

    const forward = target > current;

    // Clone whichever page must visually rotate.
    const sourceIndex = forward ? current : target;
    const sheet = pages[sourceIndex].cloneNode(true);

    sheet.classList.remove("cover");

    sheet.classList.add(
        "flip-sheet",
        forward
            ? "flip-forward"
            : "flip-back"
    );

    // The sheet is a decorative clone, not the real, interactive page.
    sheet.setAttribute("aria-hidden", "true");

    book.appendChild(sheet);

    if (forward) {
        // Reveal the destination page now; the sheet covers it
        // until it rotates far enough to disappear (backface-hidden).
        show(target);
    }

    // Finish the transition exactly once, however it's triggered.
    let finished = false;
    const finish = () => {
        if (finished) return;
        finished = true;

        if (!forward) {
            // Swap to the real page in the same frame the sheet
            // finishes covering it, so nothing appears to move.
            show(target);
        }

        sheet.remove();

        current = target;

        update();

        busy = false;

        if (bookStage) {
            bookStage.setAttribute(
                "aria-busy",
                "false"
            );
        }
    };

    // Prefer the real animation end event so timing always matches
    // the CSS, even if the flip duration changes per breakpoint.
    sheet.addEventListener("animationend", finish, { once: true });

    // Safety net in case the animation event never fires (e.g. the
    // tab was backgrounded and rAF/animations were throttled).
    setTimeout(finish, 1400);
}

// ========================================
// NEXT BUTTON
// ========================================

if (nextBtn) {
    nextBtn.addEventListener(
        "click",
        () => {
            go(current + 1);
        }
    );
}

// ========================================
// PREVIOUS BUTTON
// ========================================

if (prevBtn) {
    prevBtn.addEventListener(
        "click",
        () => {
            go(current - 1);
        }
    );
}

// ========================================
// CLICK LEFT / RIGHT SIDE OF BOOK
// ========================================

if (book) {
    book.addEventListener(
        "click",
        (event) => {
            // Don't trigger page navigation
            // when clicking buttons or controls
            if (
                event.target.closest(
                    "button, a, input, select, textarea"
                )
            ) {
                return;
            }

            const rect =
                book.getBoundingClientRect();

            const clickPosition =
                event.clientX - rect.left;

            if (
                clickPosition >
                rect.width / 2
            ) {
                go(current + 1);
            } else {
                go(current - 1);
            }
        }
    );
}

// ========================================
// TOUCH / SWIPE SUPPORT
// ========================================

if (book) {
    // Touch start
    book.addEventListener(
        "touchstart",
        (event) => {
            touchStart =
                event.changedTouches[0].screenX;
        },
        {
            passive: true
        }
    );

    // Touch end
    book.addEventListener(
        "touchend",
        (event) => {
            const touchEnd =
                event.changedTouches[0].screenX;

            const distance =
                touchEnd - touchStart;

            // Minimum swipe distance
            if (Math.abs(distance) > 35) {
                if (distance < 0) {
                    // Swipe left
                    go(current + 1);
                } else {
                    // Swipe right
                    go(current - 1);
                }
            }
        },
        {
            passive: true
        }
    );
}

// ========================================
// KEYBOARD NAVIGATION
// ========================================

document.addEventListener(
    "keydown",
    (event) => {
        // Right arrow
        if (event.key === "ArrowRight") {
            go(current + 1);
        }

        // Left arrow
        if (event.key === "ArrowLeft") {
            go(current - 1);
        }

        // Escape
        if (event.key === "Escape") {
            if (
                document.fullscreenElement
            ) {
                document.exitFullscreen();
            }
        }
    }
);

// ========================================
// FULLSCREEN
// ========================================

if (fullscreenBtn) {
    fullscreenBtn.addEventListener(
        "click",
        async () => {
            try {
                if (
                    !document.fullscreenElement
                ) {
                    if (
                        bookStage &&
                        bookStage.requestFullscreen
                    ) {
                        await bookStage.requestFullscreen();
                    }
                } else {
                    await document.exitFullscreen();
                }
            } catch (error) {
                console.error(
                    "Fullscreen error:",
                    error
                );
            }
        }
    );
}

// ========================================
// UPDATE FULLSCREEN BUTTON
// ========================================

document.addEventListener(
    "fullscreenchange",
    () => {
        if (!fullscreenBtn) return;

        if (document.fullscreenElement) {
            fullscreenBtn.setAttribute(
                "aria-label",
                "Exit fullscreen"
            );
        } else {
            fullscreenBtn.setAttribute(
                "aria-label",
                "Enter fullscreen"
            );
        }
    }
);

// ========================================
// ZOOM
// ========================================

if (zoomBtn) {
    zoomBtn.addEventListener(
        "click",
        () => {
            if (!book) return;

            book.classList.toggle("zoomed");

            const isZoomed =
                book.classList.contains(
                    "zoomed"
                );

            zoomBtn.setAttribute(
                "aria-pressed",
                isZoomed
            );

            zoomBtn.setAttribute(
                "aria-label",
                isZoomed
                    ? "Zoom out"
                    : "Zoom in"
            );
        }
    );
}

// ========================================
// INITIALIZE
// ========================================

if (pages.length > 0) {
    const firstPage = new Image();
    let initialized = false;
    const initializeReader = () => {
        if (initialized) return;
        initialized = true;
        show(0);
        update();
    };
    firstPage.onload = initializeReader;
    firstPage.onerror = initializeReader;
    firstPage.src = "assets/document-pages/page-01.png";
    window.setTimeout(initializeReader, 2500);
} else {
    console.warn(
        "No pages found in #book."
    );
}
