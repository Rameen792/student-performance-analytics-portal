/* ==========================================================================
   EduAnalytics UI POLISH
   --------------------------------------------------------------------------
   PURPOSE:
   - Adds visual interactions without modifying existing application logic.
   - Does NOT replace existing dashboard JavaScript.
   - Does NOT manage students, filters, authentication, charts, etc.
   - Only enhances the UI.
   ========================================================================== */

(function () {
  "use strict";

  /* =========================================================================
     SAFETY CHECK
     -------------------------------------------------------------------------
     Wait until the page is ready before touching UI elements.
     ========================================================================= */

  document.addEventListener("DOMContentLoaded", function () {

    /* =======================================================================
       1. STAGGERED STAT CARD ENTRANCE
       -----------------------------------------------------------------------
       Existing cards remain exactly where they are.
       We only add animation delay.
       ======================================================================= */

    const statCards = document.querySelectorAll(".stat-card");

    statCards.forEach(function (card, index) {

      card.style.animation = "eaStatCardIn 0.6s cubic-bezier(.22,1,.36,1) both";

      card.style.animationDelay = (index * 100) + "ms";

    });


    /* =======================================================================
       2. STAGGERED CHART CARD ENTRANCE
       ======================================================================= */

    const chartCards = document.querySelectorAll(".chart-card");

    chartCards.forEach(function (card, index) {

      card.classList.add("ea-reveal");

      card.style.transitionDelay = (150 + index * 120) + "ms";

      /*
       * Small timeout allows the browser to first render the initial state.
       * Then the reveal class creates the smooth entrance.
       */
      requestAnimationFrame(function () {

        setTimeout(function () {
          card.classList.add("ea-reveal-visible");
        }, 80);

      });

    });


    /* =======================================================================
       3. ACTIVITY ITEMS STAGGER
       ======================================================================= */

    const activityItems = document.querySelectorAll(".activity-item");

    activityItems.forEach(function (item, index) {

      item.classList.add("ea-reveal");

      item.style.transitionDelay = (index * 70) + "ms";

      setTimeout(function () {

        item.classList.add("ea-reveal-visible");

      }, 150 + index * 70);

    });


    /* =======================================================================
       4. TABLE ROW STAGGER
       -----------------------------------------------------------------------
       IMPORTANT:
       The dashboard table is dynamically generated.
       Therefore we use MutationObserver instead of interfering with the
       existing render() function.
       ======================================================================= */

    const tableBody = document.getElementById("studentsTableBody");

    if (tableBody) {

      const animateRows = function () {

        const rows = tableBody.querySelectorAll("tr");

        rows.forEach(function (row, index) {

          /*
           * Avoid re-animating the exact same row unnecessarily.
           */
          if (row.dataset.uiPolished === "true") {
            return;
          }

          row.dataset.uiPolished = "true";

          row.style.opacity = "0";
          row.style.transform = "translateY(8px)";

          row.style.transition =
            "opacity 0.35s ease, transform 0.35s cubic-bezier(.22,1,.36,1)";

          row.style.transitionDelay = (index * 35) + "ms";

          requestAnimationFrame(function () {

            row.style.opacity = "1";
            row.style.transform = "translateY(0)";

          });

        });

      };


      /*
       * Run once for the current table.
       */
      animateRows();


      /*
       * Watch for the existing dashboard JS rendering new rows.
       *
       * We are NOT changing the existing renderer.
       * We simply observe what it does.
       */
      const observer = new MutationObserver(function () {

        animateRows();

      });


      observer.observe(tableBody, {
        childList: true
      });

    }


    /* =======================================================================
       5. BUTTON RIPPLE EFFECT
       -----------------------------------------------------------------------
       This creates a very subtle click feedback.
       It does NOT change the button's existing click handler.
       ======================================================================= */

    const interactiveButtons = document.querySelectorAll(
      ".btn, .page-btn"
    );

    interactiveButtons.forEach(function (button) {

      button.addEventListener("pointerdown", function () {

        button.classList.add("ea-button-pressed");

      });

      button.addEventListener("pointerup", function () {

        setTimeout(function () {

          button.classList.remove("ea-button-pressed");

        }, 120);

      });

      button.addEventListener("pointerleave", function () {

        button.classList.remove("ea-button-pressed");

      });

    });


    /* =======================================================================
       6. SMOOTH ACTIVE NAV FEEDBACK
       ======================================================================= */

    const sidebarLinks = document.querySelectorAll(
      ".sidebar-menu li a"
    );

    sidebarLinks.forEach(function (link) {

      link.addEventListener("mouseenter", function () {

        link.style.setProperty(
          "--ea-nav-scale",
          "1.01"
        );

      });

      link.addEventListener("mouseleave", function () {

        link.style.setProperty(
          "--ea-nav-scale",
          "1"
        );

      });

    });


    /* =======================================================================
       7. INTERSECTION OBSERVER
       -----------------------------------------------------------------------
       Elements become visible when they enter the viewport.
       This is more efficient than constantly listening to scroll events.
       ======================================================================= */

    const revealElements = document.querySelectorAll(
      ".dashboard-main > section, .dashboard-main > .section"
    );

    if ("IntersectionObserver" in window) {

      const revealObserver = new IntersectionObserver(
        function (entries, observer) {

          entries.forEach(function (entry) {

            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add("ea-reveal-visible");

            observer.unobserve(entry.target);

          });

        },
        {
          threshold: 0.12
        }
      );


      revealElements.forEach(function (element) {

        element.classList.add("ea-reveal");

        revealObserver.observe(element);

      });

    }


    /* =======================================================================
       8. OPTIONAL NUMBER COUNT-UP
       -----------------------------------------------------------------------
       This only runs on visible numeric stat headings.
       It does not change the application's stored data.
       It only animates the visual text.
       ======================================================================= */

    function animateNumber(element, targetValue) {

      /*
       * Prevent duplicate count animations.
       */
      if (element.dataset.countAnimated === "true") {
        return;
      }

      element.dataset.countAnimated = "true";

      const duration = 850;

      const startTime = performance.now();

      function updateNumber(currentTime) {

        const progress = Math.min(
          (currentTime - startTime) / duration,
          1
        );

        /*
         * Ease-out animation:
         * starts quickly and gently slows down.
         */
        const easedProgress =
          1 - Math.pow(1 - progress, 3);

        const currentValue =
          Math.round(targetValue * easedProgress);

        element.textContent = currentValue;

        if (progress < 1) {

          requestAnimationFrame(updateNumber);

        } else {

          element.textContent = targetValue;

        }

      }

      requestAnimationFrame(updateNumber);

    }


    /*
     * Small delay ensures the existing dashboard JavaScript has already
     * populated the real numbers before we animate them.
     */
    setTimeout(function () {

      const numberElements = [
        document.getElementById("cardTotal"),
        document.getElementById("cardExcellent"),
        document.getElementById("cardAverage"),
        document.getElementById("cardAtRisk")
      ];


      numberElements.forEach(function (element) {

        if (!element) {
          return;
        }

        const value = parseInt(
          element.textContent.trim(),
          10
        );

        if (Number.isFinite(value)) {

          /*
           * Temporarily start at zero visually.
           * Existing data remains untouched.
           */
          element.textContent = "0";

          animateNumber(element, value);

        }

      });

    }, 650);


    /* =======================================================================
       9. PAGE READY CLASS
       -----------------------------------------------------------------------
       Useful for future UI polish.
       ======================================================================= */

    document.documentElement.classList.add(
      "ea-ui-polish-ready"
    );

  });

})();