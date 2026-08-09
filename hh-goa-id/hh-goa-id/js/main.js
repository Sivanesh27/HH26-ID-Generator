/* =========================================================
   HACKER HOUSE GOA 2026 — Builder ID creator
   All logic runs client-side. Nothing uploaded ever leaves
   the browser — photos are read locally via FileReader and
   only ever touch canvas for the PNG download.
   ========================================================= */
(function () {
  "use strict";

  const TOTAL_SEATS = 247;
  const MAX_TEAM = 3;

  /* ---------------------------------------------------------
     Nav toggle (mobile)
  --------------------------------------------------------- */
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.querySelector(".nav__links");
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------------------------------------------------------
     Scroll reveal
  --------------------------------------------------------- */
  const revealTargets = document.querySelectorAll(
    ".stage-card, .roadmap__node, .criteria-card, .split__col, .info-row__col, .callout"
  );
  revealTargets.forEach((el) => el.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((el) => io.observe(el));

  /* ---------------------------------------------------------
     Seat tracker — simulated, front-end only.
     Interpolates a "claimed seats" figure between the Open
     Trials start (Aug 2026) and the Residency (28 Oct 2026),
     then layers on however many IDs *this* visitor has made.
  --------------------------------------------------------- */
  function baseClaimedSeats() {
    const start = new Date("2026-08-01T00:00:00");
    const end = new Date("2026-09-30T23:59:59"); // RSVP & Stake closes
    const now = new Date();
    let pct;
    if (now <= start) pct = 0.04;
    else if (now >= end) pct = 0.94;
    else pct = 0.04 + (0.9 * (now - start)) / (end - start);
    return Math.round(pct * TOTAL_SEATS);
  }

  function getUserCreatedCount() {
    return Number(localStorage.getItem("hhgoa_roster_count") || 0);
  }

  function renderSeatTracker() {
    const claimed = Math.min(
      TOTAL_SEATS,
      baseClaimedSeats() + getUserCreatedCount()
    );
    document.getElementById("seatCount").textContent = `${claimed} / ${TOTAL_SEATS}`;
    document.getElementById("seatFill").style.width = `${(claimed / TOTAL_SEATS) * 100}%`;
    return claimed;
  }

  function nextBuilderNumber() {
    const claimed = baseClaimedSeats() + getUserCreatedCount();
    return Math.min(TOTAL_SEATS, claimed + 1);
  }

  /* ---------------------------------------------------------
     Roster progress pips
  --------------------------------------------------------- */
  function renderRosterProgress() {
    const roster = getRoster();
    document.getElementById("rosterLabel").textContent = `${roster.length} / ${MAX_TEAM} builders added`;
    for (let i = 0; i < MAX_TEAM; i++) {
      const slot = document.getElementById(`rp${i}`);
      slot.classList.toggle("is-filled", i < roster.length);
    }
  }

  /* ---------------------------------------------------------
     Form state
  --------------------------------------------------------- */
  const form = document.getElementById("idForm");
  const nameInput = document.getElementById("fullName");
  const teamInput = document.getElementById("teamName");
  const roleGroup = document.getElementById("roleGroup");
  const trackGroup = document.getElementById("trackGroup");
  const dropzone = document.getElementById("dropzone");
  const photoInput = document.getElementById("photoInput");

  let currentRole = "Builder";
  let currentTrack = { name: "AI / ML", color: "#EC1E79" };
  let currentPhoto = null; // dataURL

  function selectPill(group, btn, onSelect) {
    group.querySelectorAll("[role='radio']").forEach((el) => {
      el.classList.remove("is-active");
      el.setAttribute("aria-checked", "false");
    });
    btn.classList.add("is-active");
    btn.setAttribute("aria-checked", "true");
    onSelect();
  }

  roleGroup.addEventListener("click", (e) => {
    const btn = e.target.closest(".pill");
    if (!btn) return;
    selectPill(roleGroup, btn, () => {
      currentRole = btn.dataset.value;
      updatePreview();
    });
  });

  trackGroup.addEventListener("click", (e) => {
    const btn = e.target.closest(".swatch");
    if (!btn) return;
    selectPill(trackGroup, btn, () => {
      currentTrack = { name: btn.dataset.track, color: btn.dataset.color };
      updatePreview();
    });
  });

  nameInput.addEventListener("input", updatePreview);
  teamInput.addEventListener("input", updatePreview);

  /* ---------------------------------------------------------
     Photo upload (click + drag & drop)
  --------------------------------------------------------- */
  dropzone.addEventListener("click", () => photoInput.click());
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      photoInput.click();
    }
  });
  ["dragenter", "dragover"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("is-drag");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove("is-drag");
    })
  );
  dropzone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handlePhoto(file);
  });
  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) handlePhoto(file);
  });

  function handlePhoto(file) {
    const isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name || "");
    if (!file.type.startsWith("image/") && !isHeic) {
      showToast("That doesn't look like an image — try a JPG or PNG.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const testImg = new Image();
      testImg.onload = () => {
        currentPhoto = e.target.result;
        dropzone.classList.add("has-image");
        dropzone.querySelector(".dropzone__hint span").textContent = "Photo added — click to change";
        updatePreview();
      };
      testImg.onerror = () => {
        if (isHeic) {
          showToast("This browser can't preview HEIC photos yet — please pick a JPG or PNG (your Photos app can usually export one).");
        } else {
          showToast("Couldn't read that image — try a different file.");
        }
      };
      testImg.src = e.target.result;
    };
    reader.onerror = () => showToast("Couldn't read that file — try again.");
    reader.readAsDataURL(file);
  }

  /* ---------------------------------------------------------
     Live preview card
  --------------------------------------------------------- */
  const cardEls = {
    root: document.getElementById("idCard"),
    photo: document.getElementById("cardPhoto"),
    name: document.getElementById("cardName"),
    role: document.getElementById("cardRole"),
    track: document.getElementById("cardTrack"),
    team: document.getElementById("cardTeam"),
    number: document.getElementById("cardNumber"),
    barcode: document.getElementById("cardBarcode"),
  };

  function buildBarcodePattern(seedStr) {
    // deterministic pseudo-barcode from the name, purely decorative
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i) * (i + 1);
    const stops = [];
    let x = 0;
    let s = seed || 42;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    while (x < 100) {
      const w = 1 + rand() * 3;
      const on = rand() > 0.45;
      stops.push(`${on ? "#fff" : "transparent"} ${x}% ${x + w}%`);
      x += w;
    }
    return `linear-gradient(90deg, ${stops.join(",")})`;
  }

  function updatePreview() {
    const name = nameInput.value.trim() || "Your Name";
    const team = teamInput.value.trim() || "Solo Builder";
    cardEls.root.style.setProperty("--accent", currentTrack.color);
    cardEls.name.textContent = name;
    cardEls.role.textContent = currentRole;
    cardEls.track.textContent = currentTrack.name;
    cardEls.team.textContent = team;
    cardEls.number.textContent = `${String(nextBuilderNumber()).padStart(3, "0")} / ${TOTAL_SEATS}`;
    cardEls.barcode.style.backgroundImage = buildBarcodePattern(name + team);

    if (currentPhoto) {
      cardEls.photo.style.backgroundImage = `url(${currentPhoto})`;
      cardEls.photo.innerHTML = "";
    } else if (!cardEls.photo.querySelector(".id-card__photo-placeholder")) {
      cardEls.photo.style.backgroundImage = "";
      cardEls.photo.innerHTML = '<span class="id-card__photo-placeholder">Upload<br>photo</span>';
    }

    document.getElementById("nextNumber").textContent = String(nextBuilderNumber()).padStart(3, "0");
  }

  /* ---------------------------------------------------------
     3D tilt on the live-preview card
  --------------------------------------------------------- */
  const stage = document.querySelector(".card-stage");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (stage && !prefersReducedMotion) {
    stage.addEventListener("mousemove", (e) => {
      const rect = cardEls.root.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      cardEls.root.style.transform = `rotate(-1.2deg) rotateY(${px * 14}deg) rotateX(${-py * 14}deg) scale(1.02)`;
    });
    stage.addEventListener("mouseleave", () => {
      cardEls.root.style.transform = "rotate(-1.2deg)";
    });
  }

  /* ---------------------------------------------------------
     Roster (localStorage) — up to 3 team members
  --------------------------------------------------------- */
  function getRoster() {
    try {
      return JSON.parse(localStorage.getItem("hhgoa_roster") || "[]");
    } catch {
      return [];
    }
  }
  function saveRoster(roster) {
    localStorage.setItem("hhgoa_roster", JSON.stringify(roster));
    localStorage.setItem("hhgoa_roster_count", String(roster.length));
  }

  const rosterSection = document.getElementById("rosterSection");
  const rosterGrid = document.getElementById("rosterGrid");
  const rosterFullMsg = document.getElementById("rosterFullMsg");
  const generateBtn = document.getElementById("generateBtn");

  function cardTemplate(member) {
    return `
    <div class="id-card" style="--accent:${member.color}" data-id="${member.id}">
      <div class="id-card__lanyard" aria-hidden="true"></div>
      <div class="id-card__hole" aria-hidden="true"></div>
      <div class="id-card__top">
        <span class="id-card__brand">HACKER HOUSE <em>GOA</em></span>
        <span class="id-card__edition">ED. 2026</span>
      </div>
      <div class="id-card__photo" style="${member.photo ? `background-image:url(${member.photo})` : ""}">
        ${member.photo ? "" : '<span class="id-card__photo-placeholder">No<br>photo</span>'}
      </div>
      <h3 class="id-card__name">${escapeHtml(member.name)}</h3>
      <div class="id-card__role">${escapeHtml(member.role)}</div>
      <div class="id-card__row">
        <div><span class="id-card__k">Track</span><span class="id-card__v">${escapeHtml(member.track)}</span></div>
        <div><span class="id-card__k">Team</span><span class="id-card__v">${escapeHtml(member.team)}</span></div>
      </div>
      <div class="id-card__foot">
        <div><span class="id-card__k">Builder No.</span><span class="id-card__num">${String(member.number).padStart(3, "0")} / ${TOTAL_SEATS}</span></div>
        <span class="devanagari-badge devanagari-badge--sm" aria-hidden="true">गोवा</span>
      </div>
      <div class="id-card__barcode" style="background-image:${buildBarcodePattern(member.name + member.team)}" aria-hidden="true"></div>
      <div class="id-card__dates">GOA, INDIA · 28–31 OCT 2026</div>
      <div class="id-card__hashtag">#FrameInGoa</div>
    </div>`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderRoster() {
    const roster = getRoster();
    rosterSection.hidden = roster.length === 0;
    rosterGrid.innerHTML = roster
      .map(
        (m) => `
      <div class="roster__card-wrap">
        ${cardTemplate(m)}
        <div class="roster__actions">
          <button class="roster__mini-btn" data-download="${m.id}">Download</button>
          <button class="roster__mini-btn roster__mini-btn--x" data-share="${m.id}">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-7.2L4.5 22H1.4l8.1-9.3L1 2h7.2l5 6.6L18.9 2Zm-1.2 18h1.7L7.4 4H5.6l12.1 16Z"/></svg>
            Share
          </button>
          <button class="roster__mini-btn roster__mini-btn--pink" data-remove="${m.id}">Remove</button>
        </div>
      </div>`
      )
      .join("");
    rosterFullMsg.hidden = roster.length < MAX_TEAM;
    renderRosterProgress();
    renderSeatTracker();
  }

  rosterGrid.addEventListener("click", (e) => {
    const dl = e.target.closest("[data-download]");
    const rm = e.target.closest("[data-remove]");
    const sh = e.target.closest("[data-share]");
    if (dl) downloadCardNode(dl.closest(".roster__card-wrap").querySelector(".id-card"), dl.dataset.download);
    if (rm) {
      const roster = getRoster().filter((m) => m.id !== rm.dataset.remove);
      saveRoster(roster);
      renderRoster();
      showToast("Removed from your roster.");
    }
    if (sh) {
      const member = getRoster().find((m) => m.id === sh.dataset.share);
      const node = sh.closest(".roster__card-wrap").querySelector(".id-card");
      if (member && node) shareCardToX(node, member, sh);
    }
  });

  /* ---------------------------------------------------------
     Form submit → add to roster
  --------------------------------------------------------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const roster = getRoster();
    if (roster.length >= MAX_TEAM) {
      showToast("Your team is already full at three builders.");
      rosterSection.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      showToast("Add a name before you generate the ID.");
      return;
    }
    const member = {
      id: `b_${Date.now()}`,
      name,
      role: currentRole,
      track: currentTrack.name,
      color: currentTrack.color,
      team: teamInput.value.trim() || "Solo Builder",
      photo: currentPhoto,
      number: nextBuilderNumber(),
    };
    roster.push(member);
    saveRoster(roster);
    renderRoster();
    fireConfetti();
    showToast(`ID generated — welcome, Builder No. ${String(member.number).padStart(3, "0")}.`);

    // reset for the next teammate, keep track/role choices
    nameInput.value = "";
    currentPhoto = null;
    dropzone.classList.remove("has-image");
    dropzone.querySelector(".dropzone__hint span").textContent = "Drop a photo, or click to upload";
    photoInput.value = "";
    updatePreview();

    if (roster.length >= MAX_TEAM) {
      generateBtn.disabled = true;
      generateBtn.textContent = "Team roster full";
      document.getElementById("formHint").textContent = "Your roster has three builders — head down to review and download your IDs.";
    }

    setTimeout(() => rosterSection.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
  });

  /* ---------------------------------------------------------
     Download as PNG (html2canvas)
  --------------------------------------------------------- */
  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function downloadCardNode(node, filenameHint) {
    if (!window.html2canvas) {
      showToast("Download isn't ready yet — check your connection and try again.");
      return;
    }
    showToast("Rendering your ID…");
    html2canvas(node, {
      backgroundColor: null,
      scale: 3,
      useCORS: true,
      logging: false,
    })
      .then((canvas) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            showToast("Couldn't export that image — try again.");
            return;
          }
          triggerDownload(blob, `hacker-house-goa-id-${filenameHint || "builder"}.png`);
          showToast("ID downloaded ✓");
        }, "image/png");
      })
      .catch((err) => {
        console.error("html2canvas failed:", err);
        showToast("Download failed — please try again.");
      });
  }

  /* ---------------------------------------------------------
     Share to X
     X's compose window can't pull an image attachment in from
     a URL on its own, so the reliable flow is: download the
     real PNG first, then open X with the caption + hashtag
     already typed in — the person attaches the file themselves.
     On phones/browsers that support the native Share Sheet with
     files, we also try handing the file across directly as a
     bonus, so picking X there can attach it automatically.
  --------------------------------------------------------- */
  function buildCaption(member) {
    const track = member.track ? ` on the ${member.track} track` : "";
    return `Just built my Builder ID for Hacker House Goa 2026${track} 🌊💻 Building my way to a seat on the beach. #FrameInGoa`;
  }

  function openTweetIntent(caption, targetWindow) {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&hashtags=FrameInGoa`;
    if (targetWindow && !targetWindow.closed) targetWindow.location.href = tweetUrl;
    else window.open(tweetUrl, "_blank");
  }

  async function shareCardToX(node, member, triggerBtn) {
    // Opened synchronously (before any await) so popup blockers don't
    // swallow it — we point it at X once we're ready, or close it if the
    // native share sheet ends up handling everything instead.
    const shareWin = window.open("", "_blank");
    if (triggerBtn) triggerBtn.disabled = true;
    showToast("Preparing your share…");

    try {
      if (!window.html2canvas) throw new Error("html2canvas not loaded");

      const canvas = await html2canvas(node, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        logging: false,
      });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("could not export image");

      const slug = (member.name || "builder").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const filename = `hacker-house-goa-id-${slug || "builder"}.png`;
      const caption = buildCaption(member);

      // Always hand over the actual file — this is what gets attached.
      triggerDownload(blob, filename);

      // Bonus path: on phones/browsers that support it, offer the file to
      // the native share sheet directly, so picking X there can attach it
      // without a manual step.
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        if (shareWin && !shareWin.closed) shareWin.close();
        try {
          await navigator.share({ files: [file], text: caption });
          showToast("Badge downloaded — and sent to your share sheet, ready to post.");
          return;
        } catch (shareErr) {
          if (shareErr && shareErr.name === "AbortError") {
            showToast("Share sheet closed — opening X with your caption instead.");
          }
          // fall through to opening X directly, regardless of the error
        }
      }

      openTweetIntent(caption, shareWin);
      showToast("Badge downloaded — attach it in the X window that just opened.");
    } catch (err) {
      console.error("share failed:", err);
      showToast("Couldn't render the image — opening X with your caption anyway.");
      openTweetIntent(buildCaption(member), shareWin);
    } finally {
      if (triggerBtn) triggerBtn.disabled = false;
    }
  }

  document.getElementById("downloadAllBtn").addEventListener("click", async () => {
    const nodes = rosterGrid.querySelectorAll(".id-card");
    if (!nodes.length) return;
    for (const node of nodes) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        html2canvas(node, { backgroundColor: null, scale: 3, useCORS: true, logging: false })
          .then((canvas) => {
            canvas.toBlob((blob) => {
              if (blob) triggerDownload(blob, `hacker-house-goa-id-${node.dataset.id}.png`);
              setTimeout(resolve, 350);
            }, "image/png");
          })
          .catch((err) => {
            console.error("html2canvas failed:", err);
            resolve();
          });
      });
    }
    showToast("All IDs downloaded ✓");
  });

  /* ---------------------------------------------------------
     Toast
  --------------------------------------------------------- */
  let toastTimer;
  function showToast(msg) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }

  /* ---------------------------------------------------------
     Confetti (lightweight, no dependency)
  --------------------------------------------------------- */
  const confettiCanvas = document.getElementById("confettiCanvas");
  const ctx = confettiCanvas.getContext("2d");
  function resizeCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function fireConfetti() {
    if (prefersReducedMotion) return;
    const colors = ["#F4D91F", "#EC1E79", "#FDFCF6", "#4FD1C5"];
    const pieces = Array.from({ length: 90 }, () => ({
      x: confettiCanvas.width / 2 + (Math.random() - 0.5) * 240,
      y: confettiCanvas.height * 0.35,
      vx: (Math.random() - 0.5) * 9,
      vy: Math.random() * -9 - 3,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 12,
      life: 0,
    }));
    let frame = 0;
    function tick() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      frame++;
      let alive = false;
      pieces.forEach((p) => {
        p.vy += 0.28; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life++;
        if (p.y < confettiCanvas.height + 30) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - p.life / 140);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (alive && frame < 150) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */
  renderSeatTracker();
  renderRosterProgress();
  updatePreview();
  renderRoster();

  const existingRosterLen = getRoster().length;
  if (existingRosterLen >= MAX_TEAM) {
    generateBtn.disabled = true;
    generateBtn.textContent = "Team roster full";
  }
})();
