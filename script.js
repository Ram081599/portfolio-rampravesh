// Reveal cards and skill items on scroll
(function(){
  const revealTargets = document.querySelectorAll('.card, .skill-item');
  revealTargets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = 'opacity .6s ease, transform .6s ease';
  });
  const obs = new IntersectionObserver((entries, o) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'none';
        o.unobserve(e.target);
      }
    });
  }, {threshold: 0.12});
  revealTargets.forEach(t => obs.observe(t));

  // Modal / lightbox for project images (left in place in case you add images later)
  const modal = document.getElementById('imgModal');
  const modalImg = modal ? modal.querySelector('.modal-img') : null;
  const closeBtn = modal ? modal.querySelector('.modal-close') : null;

  if (modal) {
    document.querySelectorAll('.project-img').forEach(img => {
      img.addEventListener('click', () => {
        modalImg.src = img.src;
        modalImg.alt = img.alt || '';
        modal.classList.add('show');
        modal.setAttribute('aria-hidden','false');
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
      });
    });

    function closeModal(){
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden','true');
      if (modalImg) modalImg.src = '';
      document.body.style.overflow = '';
    }
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  }

  // Back to top button
  const topBtn = document.getElementById('toTop');
  if (topBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) topBtn.classList.add('show'); else topBtn.classList.remove('show');
    });
    topBtn.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
  }
})();

// Card tilt and expand interactions
(function(){
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    const inner = card;
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const rotY = x * 8; // degrees
      const rotX = -y * 8;
      inner.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      if (!card.classList.contains('expanded')) inner.style.transform = '';
    });

    // Toggle expand on CTA or Enter key
    const cta = card.querySelector('.cta');
    if (cta) {
      const toggle = (ev) => {
        card.classList.toggle('expanded');
        // ensure transform reset when expanded
        if (card.classList.contains('expanded')) inner.style.transform = 'none';
      };
      cta.addEventListener('click', toggle);
      cta.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    }
  });
})();

// Resume section animation
(function(){
  const resumeLink = document.querySelector('.resume-link');
  if (resumeLink) {
    resumeLink.addEventListener('mouseenter', () => {
      resumeLink.style.transform = 'scale(1.05)';
    });
    resumeLink.addEventListener('mouseleave', () => {
      resumeLink.style.transform = 'scale(1)';
    });
  }
})();

/* --- Carousel logic (in-place) --- */
(function(){
  class Carousel {
    constructor(container){
      this.container = container;
      this.track = container.querySelector('.carousel-track');
      this.slides = Array.from(container.querySelectorAll('.carousel-slide'));
      this.prevBtn = container.querySelector('.carousel-btn.prev');
      this.nextBtn = container.querySelector('.carousel-btn.next');
      this.dots = Array.from(container.querySelectorAll('.dot'));
      this.current = 0;
      this.total = this.slides.length;
      this.startX = 0;
      this.endX = 0;
      this.init();
    }

    init(){
      this.update();
      this.prevBtn && this.prevBtn.addEventListener('click', ()=> this.prev());
      this.nextBtn && this.nextBtn.addEventListener('click', ()=> this.next());
      this.dots.forEach((d,i)=> d.addEventListener('click', ()=> this.go(i)));
      // keyboard
      this.container.addEventListener('keydown', (e)=>{
        if(e.key === 'ArrowLeft') this.prev();
        if(e.key === 'ArrowRight') this.next();
      });
      // touch
      this.container.addEventListener('touchstart', (e)=>{ this.startX = e.changedTouches[0].clientX; });
      this.container.addEventListener('touchend', (e)=>{ this.endX = e.changedTouches[0].clientX; this.handleSwipe(); });
      // make container focusable for keyboard
      this.container.setAttribute('tabindex','0');
    }

    handleSwipe(){
      if(this.startX - this.endX > 50) this.next();
      if(this.endX - this.startX > 50) this.prev();
    }

    update(){
      this.track.style.transform = `translateX(-${this.current * 100}%)`;
      this.slides.forEach((s,i)=> s.classList.toggle('active', i===this.current));
      this.dots.forEach((d,i)=> d.classList.toggle('active', i===this.current));
      if(this.prevBtn) this.prevBtn.style.opacity = this.current===0? '0.45':'1';
      if(this.nextBtn) this.nextBtn.style.opacity = this.current===this.total-1? '0.45':'1';
    }

    next(){ if(this.current < this.total-1){ this.current++; this.update(); }}
    prev(){ if(this.current > 0){ this.current--; this.update(); }}
    go(i){ this.current = Math.max(0, Math.min(this.total-1, i)); this.update(); }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const c = document.querySelector('.carousel-container');
    if(c) new Carousel(c);
  });
})();

/* End carousel logic */

/* --- Skills carousel --- */
(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.skills-container');
    const track = document.querySelector('.skills-grid');
    const prevBtn = document.querySelector('.skills-nav.prev');
    const nextBtn = document.querySelector('.skills-nav.next');
    
    if (!track || !container || !prevBtn || !nextBtn) return;

    let position = 0;
    const itemWidth = 160; // width of each skill item
    const gap = 16; // gap between items
    const itemsPerScroll = 0.5; // Smaller increment for smoother animation
    const scrollAmount = (itemWidth + gap) * itemsPerScroll;
    let autoScrollInterval = null;
    let pauseTimeout = null;
    const AUTO_SCROLL_DELAY = 100; // Update every 50ms for smooth movement
    const INTERACTION_PAUSE = 1000; // Resume after 1 second of no interaction
    const SCROLL_SPEED = 2; // Pixels to move per frame
    
    // Calculate the width of a complete set of items
    const items = track.children;
    const totalItems = items.length;
    const itemsPerSet = totalItems / 2; // Since we duplicated the set
    const setWidth = (itemWidth + gap) * itemsPerSet;

    function updateNavigation() {
      const maxScroll = track.scrollWidth - container.clientWidth;
      prevBtn.classList.toggle('disabled', position <= 0);
      nextBtn.classList.toggle('disabled', position >= maxScroll);
    }

    function scroll(direction, isAuto = false) {
      const scrollStep = itemWidth + gap;
      
      if (direction === 'prev') {
        position -= scrollStep;
        // If we're at the start of the first set, jump to the same position in the second set
        if (position < 0) {
          position = setWidth + position;
          track.style.transition = 'none';
          track.style.transform = `translateX(-${position}px)`;
          // Force reflow
          track.offsetHeight;
          track.style.transition = 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
          // 'transform 0.5s ease';
        }
      } else {
        position += scrollStep;
        // If we're at the end of the second set, jump back to the same position in the first set
        if (position > setWidth * 2) {
          position = position - setWidth;
          track.style.transition = 'none';
          track.style.transform = `translateX(-${position}px)`;
          // Force reflow
          track.offsetHeight;
          track.style.transition = 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
        }
      }

      track.style.transform = `translateX(-${position}px)`;

      if (!isAuto) {
        pauseAutoScroll();
      }
    }

    let animationFrameId = null;
    let lastTimestamp = 0;

    function animate(timestamp) {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const elapsed = timestamp - lastTimestamp;
      
      if (elapsed >= AUTO_SCROLL_DELAY) {
        position += SCROLL_SPEED;
        
        // If we reach the end of the second set, jump back to first set
        if (position >= setWidth * 2) {
          position = position - setWidth;
          track.style.transition = 'none';
          track.style.transform = `translateX(-${position}px)`;
          // Force reflow
          track.offsetHeight;
          track.style.transition =  'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        
        track.style.transform = `translateX(-${position}px)`;
        lastTimestamp = timestamp;
      }
      
      animationFrameId = requestAnimationFrame(animate);
    }

    function startAutoScroll() {
      if (animationFrameId) return;
      lastTimestamp = 0;
      track.style.transition =  'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
      animationFrameId = requestAnimationFrame(animate);
    }

    function stopAutoScroll() {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }

    function pauseAutoScroll() {
      stopAutoScroll();
      if (pauseTimeout) {
        clearTimeout(pauseTimeout);
      }
      pauseTimeout = setTimeout(startAutoScroll, INTERACTION_PAUSE);
    }

    // Event Listeners
    prevBtn.addEventListener('click', () => scroll('prev'));
    nextBtn.addEventListener('click', () => scroll('next'));

    // Pause on hover
    container.addEventListener('mouseenter', stopAutoScroll);
    container.addEventListener('mouseleave', () => {
      pauseTimeout = setTimeout(startAutoScroll, 1000);
    });

    // Touch support
    let touchStart = 0;
    let touchX = 0;
    let isDragging = false;

    track.addEventListener('touchstart', (e) => {
      touchStart = e.touches[0].clientX;
      touchX = position;
      isDragging = true;
      track.style.transition = 'none';
      stopAutoScroll();
    });

    track.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      const currentX = e.touches[0].clientX;
      const diff = touchStart - currentX;
      position = Math.min(
        track.scrollWidth - container.clientWidth,
        Math.max(0, touchX + diff)
      );
      
      track.style.transform = `translateX(-${position}px)`;
    });

    track.addEventListener('touchend', () => {
      isDragging = false;
      track.style.transition =  'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
      updateNavigation();
      pauseAutoScroll();
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const maxScroll = track.scrollWidth - container.clientWidth;
        position = Math.min(position, maxScroll);
        track.style.transform = `translateX(-${position}px)`;
        updateNavigation();
      }, 100);
    });

    // Touch movement handling with infinite scroll logic
    track.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      const currentX = e.touches[0].clientX;
      const diff = touchStart - currentX;
      let newPosition = touchX + diff;
      
      // Handle infinite scroll boundaries
      if (newPosition < 0) {
        newPosition = setWidth + newPosition;
        touchX = newPosition - diff;
        touchStart = currentX;
      } else if (newPosition > setWidth * 2) {
        newPosition = newPosition - setWidth;
        touchX = newPosition - diff;
        touchStart = currentX;
      }
      
      position = newPosition;
      track.style.transform = `translateX(-${position}px)`;
    });

    // Start with first set
    position = 0;
    track.style.transform = `translateX(-${position}px)`;
    startAutoScroll();
  });
})();

/* End skills auto-scroll */