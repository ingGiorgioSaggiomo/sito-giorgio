document.addEventListener('DOMContentLoaded', () => {
    // 1. Header Particles Animation
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        function resizeCanvas() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }
        resizeCanvas();
        let particles = [];
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 1.5 + 1;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                this.color = 'rgba(255, 255, 255, 0.5)';
            }
            update() {
                if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
                if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
                this.x += this.speedX;
                this.y += this.speedY;
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        function initParticles() {
            const particleCount = Math.floor(canvas.width / 20);
            for (let i = 0; i < particleCount; i++) { particles.push(new Particle()); }
        }
        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(animateParticles);
        }
        initParticles();
        animateParticles();
        window.addEventListener('resize', () => {
            resizeCanvas();
            particles = [];
            initParticles();
        });
    }
    // 2. Fade In on Scroll
    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in-section').forEach(section => {
        fadeInObserver.observe(section);
    });
    // 3. Back to Top Button
    const backToTopButton = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.remove('hidden');
        } else {
            backToTopButton.classList.add('hidden');
        }
    });
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    // 4. Lightbox (now supports all lightboxable images and multi-image galleries)
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    // Prepara tutte le gallerie, compresa la bio
    const galleries = {
        gallery1: [
            'img/portfolio1a.jpg',
            'img/portfolio1b.jpg'
        ],
        gallery2: [
            'img/portfolio2a.jpg',
            'img/portfolio2b.jpg'
        ],
        gallery3: [
            'img/portfolio3a.jpg',
            'img/portfolio3b.jpg'
        ],
        gallery4: [
            'img/portfolio4a.jpg',
            'img/portfolio4b.jpg'
        ],
        gallery5: [
            'img/portfolio5a.jpg',
            'img/portfolio5b.jpg'
        ],
        gallery6: [
            'img/portfolio6a.jpg',
            'img/portfolio6b.jpg'
        ],
        bio: [
            'https://inggiorgiosaggiomo.github.io/sito-giorgio/img/giorgio-saggiomo.jpg'
        ]
    };
    let currentGallery = [];
    let currentIndex = 0;
    function showImage(index) {
        lightboxImg.src = currentGallery[index];
        currentIndex = index;
        lightboxPrev.style.display = index > 0 ? 'block' : 'none';
        lightboxNext.style.display = index < currentGallery.length - 1 ? 'block' : 'none';
    }
    // Attiva lightbox su tutte le immagini lightboxable
    document.querySelectorAll('.lightboxable').forEach(img => {
        img.addEventListener('click', () => {
            const galleryKey = img.dataset.gallery;
            const imgUrl = img.dataset.img || img.src;
            currentGallery = galleries[galleryKey] || [imgUrl];
            let idx = 0;
            // Se l'immagine è in una galleria, trova l'indice giusto
            if (galleries[galleryKey]) {
                idx = galleries[galleryKey].indexOf(imgUrl);
                if (idx < 0) idx = 0;
            }
            lightbox.classList.remove('hidden');
            showImage(idx);
        });
    });
    lightboxClose.addEventListener('click', () => lightbox.classList.add('hidden'));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.add('hidden'); });
    lightboxPrev.addEventListener('click', () => { if (currentIndex > 0) showImage(currentIndex - 1); });
    lightboxNext.addEventListener('click', () => { if (currentIndex < currentGallery.length - 1) showImage(currentIndex + 1); });
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('hidden')) {
            if (e.key === 'Escape') lightbox.classList.add('hidden');
            if (e.key === 'ArrowLeft') lightboxPrev.click();
            if (e.key === 'ArrowRight') lightboxNext.click();
        }
    });
    // 5. Scrollspy
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('main section[id]');
    const observerOptions = { rootMargin: '-30% 0px -70% 0px' };
    const sectionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        const id = entry.target.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${id}"]`);
        if (entry.isIntersecting) {
          navLinks.forEach(link => link.classList.remove('active'));
          navLink.classList.add('active');
        }
      });
    }, observerOptions);
    sections.forEach(section => { sectionObserver.observe(section); });
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            // Solo previeni il default per anchor interni (iniziano con #)
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    const navHeight = document.querySelector('nav').offsetHeight;
                    const targetPosition = targetSection.offsetTop - navHeight;
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                }
            }
            // Altrimenti lascia il comportamento di default per link esterni (come contenuti.html)
        });
    });
    // 6. MULTILINGUA
    const langSwitch = document.getElementById('lang-switch');
    let currentLang = 'it';
    const translations = window.siteTranslations || { it: {} };
    langSwitch.addEventListener('click', () => {
        currentLang = currentLang === 'it' ? 'en' : 'it';
        langSwitch.textContent = currentLang === 'it' ? 'English' : 'Italiano';
        document.documentElement.lang = currentLang;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (currentLang === 'en' && translations.en[key]) el.innerHTML = translations.en[key];
            if (currentLang === 'it') el.innerHTML = el.dataset.original || el.innerHTML;
        });
    });
    // Save original ITA texts for fallback
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.dataset.original = el.innerHTML;
    });
});
