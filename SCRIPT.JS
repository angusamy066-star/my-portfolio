// ---- scroll reveal ----
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  });
},{threshold:0.15, rootMargin:'0px 0px -60px 0px'});
revealEls.forEach(el=>io.observe(el));

// ---- sticky orb: fixed position, reacts to every scroll ----
const ringProgress = document.getElementById('ringProgress');
const orbCore = document.getElementById('orbCore');
const orbPct = document.getElementById('orbPct');
const CIRC = 2 * Math.PI * 52; // 326.7

function updateOrb(){
  const scrollTop = window.scrollY;
  const docH = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docH > 0 ? Math.min(1, Math.max(0, scrollTop / docH)) : 0;

  // progress ring reacts to scroll position
  if (ringProgress) ringProgress.style.strokeDashoffset = CIRC - (CIRC * pct);
  if (orbPct) orbPct.textContent = Math.round(pct*100) + '%';

  // core photo rotates continuously with scroll — object itself never moves
  if (orbCore) orbCore.style.transform = `rotate(${scrollTop * 0.4}deg)`;
}
updateOrb();

let ticking = false;
window.addEventListener('scroll', ()=>{
  if(!ticking){
    requestAnimationFrame(()=>{ updateOrb(); ticking = false; });
    ticking = true;
  }
}, {passive:true});

// tiny reactive pulse on every scroll tick — object stays put, only scale reacts
const orb = document.querySelector('.sticky-orb');
let pulseTimeout;
window.addEventListener('scroll', ()=>{
  if(orb){
    orb.style.setProperty('--scale', '1.06');
    clearTimeout(pulseTimeout);
    pulseTimeout = setTimeout(()=>{ orb.style.setProperty('--scale', '1'); }, 160);
  }
}, {passive:true});

// ---- Inject 3D UI enhancements (styles + interactive JS) ----
(function inject3DEffects(){
  // Inject CSS so no external file edits are required
  const css = `
  :root{
    --perspective: 900px;
    --tilt-amount: 12deg;
    --orb-depth: 40px;
    --card-shadow: 0 10px 30px rgba(10,10,20,0.12);
    --card-shadow-hover: 0 20px 50px rgba(10,10,30,0.18);
  }

  /* Make elements that should respond in 3D use this class */
  .tilt3d, .card, .sticky-orb, .reveal.in{
    transform-style: preserve-3d;
    backface-visibility: hidden;
    transition: transform 240ms cubic-bezier(.2,.9,.3,1), box-shadow 240ms ease, filter 240ms ease;
    will-change: transform;
    perspective: var(--perspective);
  }

  /* Card styles (non-destructive — will enhance existing .card if present) */
  .card{
    background: linear-gradient(180deg, rgba(255,255,255,0.7), rgba(245,245,255,0.6));
    box-shadow: var(--card-shadow);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    transform-origin: center center;
  }
  .card .card-inner{
    transform-style: preserve-3d;
  }
  .card:hover{ box-shadow: var(--card-shadow-hover); filter: saturate(1.02); }

  /* Orb depth and glow */
  .sticky-orb{
    --scale: 1;
    transform-origin: center center;
    transition: transform 200ms cubic-bezier(.2,.9,.3,1), box-shadow 200ms ease;
  }
  .sticky-orb::after{
    content: '';
    position: absolute;
    left: 50%; top: 50%;
    transform: translate(-50%,-50%) translateZ(-1px);
    width: 160%; height: 160%;
    background: radial-gradient(ellipse at center, rgba(0,0,0,0.12), transparent 40%);
    z-index: -1;
    pointer-events: none;
    filter: blur(12px);
    opacity: 0.9;
  }

  /* Small parallax layers via data-depth on elements */
  [data-depth]{
    transform-style: preserve-3d;
    transition: transform 180ms cubic-bezier(.2,.9,.3,1);
  }

  /* Accessibility: reduce motion respects user preference */
  @media (prefers-reduced-motion: reduce){
    .tilt3d, .card, .sticky-orb, [data-depth]{
      transition: none !important;
    }
  }
  `;

  const s = document.createElement('style');
  s.setAttribute('data-injected-3d', 'true');
  s.textContent = css;
  document.head.appendChild(s);

  // Interactive tilt + parallax handler
  const pointerItems = Array.from(document.querySelectorAll('.tilt3d, .card, .sticky-orb'));
  const parallaxItems = Array.from(document.querySelectorAll('[data-depth]'));

  let raf = null;
  function onPointerMove(e){
    const x = (e.clientX !== undefined) ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX);
    const y = (e.clientY !== undefined) ? e.clientY : (e.touches && e.touches[0] && e.touches[0].clientY);

    if(raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(()=>{
      pointerItems.forEach(el=>{
        if(!el.isConnected) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width/2;
        const cy = rect.top + rect.height/2;
        const dx = x - cx;
        const dy = y - cy;
        const px = dx / rect.width; // -0.5 .. 0.5
        const py = dy / rect.height;
        const tiltX = Math.max(-varOr(12), Math.min(varOr(12), (py * varOr(12))));
        const tiltY = Math.max(-varOr(12), Math.min(varOr(12), (-px * varOr(12))));

        // Depth translateZ for a subtle pop on hover/orb
        const depth = (el.classList.contains('sticky-orb')) ? varOrPx(40) * (1 - Math.hypot(px,py)) : 0;

        el.style.transform = `perspective(${getComputedStyle(document.documentElement).getPropertyValue('--perspective')||'900px'}) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(${depth}px) scale(${getComputedStyle(el).getPropertyValue('--scale')||1})`;
      });

      parallaxItems.forEach(el=>{
        if(!el.isConnected) return;
        const depthAttr = parseFloat(el.getAttribute('data-depth')) || 0.1;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width/2;
        const cy = rect.top + rect.height/2;
        const dx = (x - cx) / rect.width;
        const dy = (y - cy) / rect.height;
        const tx = -dx * depthAttr * 20; // px
        const ty = -dy * depthAttr * 20;
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
    });
  }

  function onPointerLeave(e){
    // reset transforms
    pointerItems.forEach(el=>{
      if(!el.isConnected) return;
      el.style.transform = '';
    });
    parallaxItems.forEach(el=>{ if(!el.isConnected) return; el.style.transform = ''; });
  }

  // tiny helpers to read CSS var fallback
  function varOr(n){
    // read --tilt-amount (deg) from :root if present, fallback to n
    const v = getComputedStyle(document.documentElement).getPropertyValue('--tilt-amount').trim();
    const parsed = parseFloat(v) || n;
    return parsed;
  }
  function varOrPx(n){
    const v = getComputedStyle(document.documentElement).getPropertyValue('--orb-depth').trim();
    const parsed = parseFloat(v) || n;
    return parsed;
  }

  // Respect reduced-motion
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!prefersReduced){
    window.addEventListener('mousemove', onPointerMove, {passive:true});
    window.addEventListener('touchmove', onPointerMove, {passive:true});
    window.addEventListener('mouseleave', onPointerLeave, {passive:true});
    window.addEventListener('touchend', onPointerLeave, {passive:true});
  }

  // Add data-depth to orb core for a small layered effect if not present
  if(orbCore && !orbCore.hasAttribute('data-depth')) orbCore.setAttribute('data-depth', '0.12');

})();
