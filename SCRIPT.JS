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
  ringProgress.style.strokeDashoffset = CIRC - (CIRC * pct);
  orbPct.textContent = Math.round(pct*100) + '%';

  // core photo rotates continuously with scroll — object itself never moves
  orbCore.style.transform = `rotate(${scrollTop * 0.4}deg)`;
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
  orb.style.setProperty('--scale', '1.06');
  clearTimeout(pulseTimeout);
  pulseTimeout = setTimeout(()=>{ orb.style.setProperty('--scale', '1'); }, 160);
}, {passive:true});