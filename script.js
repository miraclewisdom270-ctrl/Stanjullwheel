(() => {
  "use strict";

  const engineSound = document.getElementById("engineSound");
  const brakeSound = document.getElementById("brakeSound");
  const overlay = document.getElementById("intro-overlay");
  const enterButton = document.getElementById("enterGarage");
  const skipButton = document.getElementById("skipIntro");
  const soundToggle = document.getElementById("soundToggle");
  const soundLabel = soundToggle.querySelector(".sound-label");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let muted = false;
  let introStarted = false;
  let introTimeline = null;

  function setSoundState(isMuted) {
    muted = isMuted;
    engineSound.muted = muted;
    brakeSound.muted = muted;
    soundToggle.setAttribute("aria-pressed", String(muted));
    soundToggle.setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
    soundLabel.textContent = muted ? "SOUND OFF" : "SOUND ON";
  }

  async function playAudio(audio, volume) {
    audio.volume = volume;
    try {
      await audio.play();
      return true;
    } catch (error) {
      if (error.name === "AbortError") return false;
      console.warn("Audio playback was unavailable:", error);
      return false;
    }
  }

  function finishIntro() {
    document.body.classList.remove("intro-active");
    overlay.classList.add("is-hidden");
    engineSound.pause();
    engineSound.currentTime = 0;
  }

  function startIntro() {
    if (introStarted) return;
    introStarted = true;
    enterButton.disabled = true;
    playAudio(engineSound, muted ? 0 : 0.6);
    if (!window.gsap || prefersReducedMotion) {
      finishIntro();
      return;
    }

    introTimeline = gsap.timeline({ onComplete: finishIntro });
    introTimeline.to(enterButton, { opacity: 0, y: -20, duration: 0.3 })
      .to(".intro-line", { width: "100%", duration: 0.65, ease: "power3.inOut", onStart: () => {
        brakeSound.currentTime = 0;
        playAudio(brakeSound, muted ? 0 : 0.55);
      } }, "-=0.05")
      .to(".intro-line", { opacity: 0, duration: 0.2 })
      .to("#introKicker", { opacity: 1, duration: 0.35 })
      .to("#introBrand", { opacity: 1, letterSpacing: "0px", scale: 1, duration: 0.95, ease: "power4.out" }, "-=0.1")
      .to("#introBrand", { x: () => gsap.utils.random(-5, 5), repeat: 5, yoyo: true, duration: 0.055 }, "-=0.55")
      .to("#introSpeed", { opacity: 1, x: 0, duration: 0.55, onStart: () => { engineSound.volume = muted ? 0 : 0.85; } }, "-=0.05")
      .to("#introCar", { left: "50%", xPercent: -50, filter: "blur(0px)", duration: 1.15, ease: "power3.out", onStart: () => { engineSound.playbackRate = 1.12; } }, "+=0.12")
      .to(".intro-car .headlight", { opacity: 1, repeat: 3, yoyo: true, duration: 0.12 }, "-=0.4")
      .to("#introCaption", { opacity: 1, duration: 0.3 }, "-=0.1")
      .to(overlay, { scale: 20, opacity: 0, duration: 0.7, ease: "power3.in" }, "+=0.35");
  }

  function skipIntro() {
    if (introTimeline) introTimeline.kill();
    finishIntro();
  }

  document.body.classList.add("intro-active");
  enterButton.addEventListener("click", startIntro);
  skipButton.addEventListener("click", skipIntro);

  soundToggle.addEventListener("click", () => setSoundState(!muted));

  window.addEventListener("mousemove", (event) => {
    if (window.matchMedia("(max-width: 700px)").matches) return;
    const x = (event.clientX / window.innerWidth - 0.5) * -12;
    const y = (event.clientY / window.innerHeight - 0.5) * -8;
    document.querySelector(".hero-image").style.transform = `scale(1.04) translate(${x}px, ${y}px)`;
  });

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  const FALLBACK_CAR_IMAGE = "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80";

  function formatPrice(price) {
    if (typeof price === "number") return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(price);
    return escapeHtml(price || "Price on request");
  }

  function getCarsList(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.cars)) return data.cars;
    if (data && Array.isArray(data.items)) return data.items;
    return [];
  }

  function renderCars(data) {
    const cars = getCarsList(data);
    const grid = document.getElementById("inventoryGrid");
    if (!Array.isArray(cars) || cars.length === 0) {
      grid.innerHTML = '<p class="inventory-status">Our next arrivals are being prepared. Contact us to discuss your search.</p>';
      return;
    }

    grid.innerHTML = cars.map((car, index) => {
      const name = escapeHtml(car.name || "Vehicle");
      const image = escapeHtml(car.image || FALLBACK_CAR_IMAGE);
      const specs = Array.isArray(car.specs) ? car.specs.join(" · ") : (car.specs || "Vehicle details available on request");
      const year = Number(car.year) || String(specs || "").match(/\b(?:19|20)\d{2}\b/)?.[0] || "year not specified";
      const enquiry = encodeURIComponent(`Hi Stanley, I want to buy ${car.name || "car"} ${year} at ${car.price || "Price on request"} from STANJULLWHEELS website. Is it still available in Lagos? Can I come inspect?`);
      const whatsapp = `https://wa.me/2349068629026?text=${enquiry}`;
      return `<article class="car-card">
        <div class="car-photo"><img src="${image}" alt="${name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800'"><span class="car-number">0${index + 1} / 0${cars.length}</span></div>
        <div class="car-info"><div class="car-title-line"><h3>${name}</h3><span class="car-price">${formatPrice(car.price)}</span></div>
        <p class="car-specs">${escapeHtml(specs)}</p>
        <a class="car-whatsapp" href="${whatsapp}" target="_blank" rel="noopener noreferrer">ENQUIRE ON WHATSAPP <span>↗</span></a></div>
      </article>`;
    }).join("");
  }

  async function loadCars() {
    try {
      const response = await fetch("/data/cars.json");
      if (!response.ok) throw new Error(`Inventory request failed (${response.status})`);
      renderCars(await response.json());
    } catch (error) {
      console.error("Unable to load vehicle inventory:", error);
      renderCars({
        cars: [{
          id: 0,
          name: "STANJULLWHEELS Collection",
          brand: "Luxury & Performance",
          price: "Contact for price",
          image: FALLBACK_CAR_IMAGE,
          year: new Date().getFullYear(),
          badge: "AVAILABLE",
          specs: "Please enquire for current availability"
        }]
      });
    }
  }

  loadCars();
})();
