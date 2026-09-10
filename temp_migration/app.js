/* ============================================================
   CropGuard Dashboard – app.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Nav link active state
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // Map tabs
  const mapTabs = document.querySelectorAll('.map-tab');
  mapTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      mapTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // Language selector buttons
  const langBtns = document.querySelectorAll('.lang-select-btn');
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      langBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Mic button – toggle animation
  const micBtn = document.getElementById('mic-btn');
  let micActive = false;
  if (micBtn) {
    micBtn.addEventListener('click', () => {
      micActive = !micActive;
      const waveBars = document.querySelectorAll('.wave-bar');
      waveBars.forEach(bar => {
        bar.style.animationPlayState = micActive ? 'running' : 'paused';
      });
      micBtn.style.background = micActive
        ? 'linear-gradient(135deg, #c62828, #e53935)'
        : 'linear-gradient(135deg, #7c3aed, #9c27b0)';
    });
  }

  // Scan crop button
  const scanBtn = document.getElementById('scan-crop-btn');
  if (scanBtn) {
    scanBtn.addEventListener('click', () => {
      alert('Scan Crop feature – AI diagnosis coming soon!');
    });
  }

  // Map zoom controls (visual only)
  const zoomIn = document.getElementById('map-zoom-in');
  const zoomOut = document.getElementById('map-zoom-out');
  if (zoomIn) zoomIn.addEventListener('click', () => console.log('Zoom in'));
  if (zoomOut) zoomOut.addEventListener('click', () => console.log('Zoom out'));

});
