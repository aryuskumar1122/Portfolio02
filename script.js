(function(){
    'use strict';
  
    // Bulletproof Preloader Removal: Ensures the UI unlocks even if WebGL fails
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        var preloader = document.getElementById('preloader');
        if (preloader) preloader.classList.add('hidden');
      }, 600);
    });
  
    var PROJECTS = [
      { 
        title: 'Model Regression Detection System', 
        desc: 'A CI/CD-style pipeline that continuously tests any LLM-powered feature against a golden dataset to detect quality regressions before bad outputs reach users.', 
        tags: ['Python', 'OpenAI', 'GitHub Actions'], 
        fullDesc: '<p>Every AI team ships prompt changes blind. This architecture resolves that by implementing evaluation as code.</p><ul><li><strong>Golden Dataset:</strong> Versioned JSON containing hand-curated edge cases to establish a ground-truth baseline.</li><li><strong>Multi-Dimensional Scoring:</strong> Evaluates prompt adjustments using exact matching and LLM-as-a-judge scoring on 1-5 scales.</li><li><strong>Alerting & CI/CD:</strong> Operates as a GitHub Action, diffing outputs against previous runs, alerting via Slack webhooks, and blocking PRs if critical regressions are detected.</li></ul>'
      },
      { 
        title: 'LLM Cost Autopilot', 
        desc: 'An intelligent routing layer that analyzes each incoming request\'s complexity and routes it to the cheapest model capable of handling it at acceptable quality.', 
        tags: ['FastAPI', 'Scikit-learn', 'Docker'], 
        fullDesc: '<p>A dynamic gateway designed to mitigate over-provisioned LLM calls, reducing API costs without sacrificing output quality.</p><ul><li><strong>Complexity Classifier:</strong> Utilizes Scikit-learn to parse prompts into tiers (simple, moderate, complex).</li><li><strong>Dynamic Routing:</strong> Routes simple tasks to local/cheaper models (e.g., Llama/Haiku) and complex tasks to premium models (e.g., GPT-4o).</li><li><strong>Quality Verification:</strong> Async verification loop tests lower-tier outputs against premium models, escalating on failures and continuously retraining the routing logic.</li></ul>'
      },
      { 
        title: 'Failure Forensics Tool', 
        desc: 'An observability layer for multi-step AI pipelines that traces every intermediate step to identify exactly where failures originate when the final output is bad.', 
        tags: ['OpenTelemetry', 'SQLite', 'LangChain'], 
        fullDesc: '<p>A diagnostic engine that traces complex, multi-agent AI pipelines to find the specific node where data degrades.</p><ul><li><strong>Tracing Layer:</strong> Uses OpenTelemetry to wrap spans around each pipeline step, storing serialized inputs, outputs, and raw LLM responses.</li><li><strong>Backward Trace Analyzer:</strong> If an end output is flagged, it works backward through spans, using LLM-as-a-judge to identify the exact step where output quality plummeted.</li><li><strong>Visual Explorer:</strong> Provides a UI for engineers to see pipeline nodes colored by health, expediting root cause analysis.</li></ul>'
      },
      { 
        title: 'Hybrid Search RAG Pipeline', 
        desc: 'A production-grade system that indexes internal documentation with both dense vector and sparse keyword search, generating grounded answers with citations.', 
        tags: ['ChromaDB', 'BM25', 'FastAPI'], 
        fullDesc: '<p>An enterprise Retrieval-Augmented Generation pipeline solving the limitations of basic semantic search.</p><ul><li><strong>Hybrid Retrieval:</strong> Combines dense vector search (ChromaDB) with exact keyword matching (BM25) using Reciprocal Rank Fusion (RRF).</li><li><strong>Citation Verification:</strong> Forces the LLM to provide bracketed citations. A secondary LLM pass verifies that the cited chunk actually supports the generated claim.</li><li><strong>Confidence Scoring:</strong> Returns answers with a composite score based on retrieval confidence, citation coverage, and completeness.</li></ul>'
      },
      { 
        title: 'AI Feature Flag System', 
        desc: 'A feature flag platform supporting gradual percentage-based rollouts that triggers automatic rollback if AI output quality degrades below a threshold.', 
        tags: ['Redis', 'PostgreSQL', 'LLM-as-judge'], 
        fullDesc: '<p>A progressive delivery system tailored for the non-binary nature of AI feature success.</p><ul><li><strong>Staged Rollouts:</strong> Incremental traffic exposure (e.g., 1% -> 10% -> 100%) managed by a Redis-backed evaluation engine.</li><li><strong>Async Quality Evaluator:</strong> Continuously monitors user interactions and LLM outputs in real-time behind the flag.</li><li><strong>Auto-Rollback:</strong> Automatically halts rollout and reverts traffic to baseline if rolling quality windows (e.g., P10 quality scores) dip below configured thresholds.</li></ul>'
      },
      { 
        title: 'Agent Orchestration System', 
        desc: 'A multi-agent orchestration platform where a supervisor agent decomposes complex tasks and delegates to specialized tool-using agents with persistent memory.', 
        tags: ['LangGraph', 'Celery', 'ChromaDB'], 
        fullDesc: '<p>A robust state machine for coordinating autonomous agents through complex workflows.</p><ul><li><strong>Supervisor & Specialists:</strong> LangGraph workflow where a supervisor breaks down tasks and delegates them to specialized agents with specific tool access.</li><li><strong>Dual Memory System:</strong> Redis handles short-term working memory for active tasks, while ChromaDB stores semantic lessons learned for future planning.</li><li><strong>Human-in-the-Loop:</strong> Pauses execution and pushes to a review queue when the supervisor\'s confidence drops or a sensitive action is required.</li></ul>'
      }
    ];
    
    var SIGNAL_COLORS = ['#00e5ff', '#9d00ff', '#ff00aa', '#00e5ff', '#9d00ff', '#ff00aa'];
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  
    var scrollContainer = document.getElementById('scrollContainer');
    var sections = Array.prototype.slice.call(document.querySelectorAll('.section'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.progress-nav i'));
    var cursorDot = document.getElementById('cursorDot');
    var cursorRing = document.getElementById('cursorRing');
    var carouselStage = document.getElementById('carouselStage');
    var carouselEl = document.getElementById('carousel');
    var carouselHint = document.getElementById('carouselHint');
  
    // Modal Elements
    var projectModal = document.getElementById('projectModal');
    var modalClose = document.getElementById('modalClose');
    var modalTitle = document.getElementById('modalTitle');
    var modalTags = document.getElementById('modalTags');
    var modalDesc = document.getElementById('modalDesc');
  
    if (!isCoarsePointer) document.body.classList.add('has-fine-pointer');
  
    /* --- Web Audio API Setup --- */
    function SoundEngine(){ this.ctx = null; this.master = null; this.enabled = true; }
    SoundEngine.prototype.ensureContext = function(){
      if (!this.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    };
    SoundEngine.prototype.tone = function(freq, dur, type, peak){
      if (!this.enabled || !this.ctx) return;
      var t0 = this.ctx.currentTime;
      var osc = this.ctx.createOscillator();
      var gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(peak || 0.2, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain); gain.connect(this.master);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    };
    SoundEngine.prototype.tick = function(){ this.tone(900 + Math.random()*150, 0.04, 'square', 0.08); };
    SoundEngine.prototype.hover = function(){ this.tone(1400, 0.05, 'sine', 0.04); };
    SoundEngine.prototype.click = function(){ this.tone(600, 0.1, 'triangle', 0.15); };
  
    var sfx = new SoundEngine();
    function unlockAudio(){ sfx.ensureContext(); window.removeEventListener('pointerdown', unlockAudio); }
    window.addEventListener('pointerdown', unlockAudio);
  
    document.getElementById('soundToggle').addEventListener('click', function(e){
      sfx.enabled = !sfx.enabled; sfx.ensureContext();
      document.getElementById('soundIconOn').style.display = sfx.enabled ? 'block' : 'none';
      document.getElementById('soundIconOff').style.display = sfx.enabled ? 'none' : 'block';
    });
  
    /* --- Custom Cursor --- */
    var mouseX = window.innerWidth/2, mouseY = window.innerHeight/2, ringX = mouseX, ringY = mouseY, cursorSeen = false;
    window.addEventListener('mousemove', function(e){
      mouseX = e.clientX; mouseY = e.clientY;
      cursorDot.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px) translate(-50%,-50%)';
      if (!cursorSeen) { cursorSeen = true; cursorDot.classList.add('visible'); cursorRing.classList.add('visible'); document.body.classList.add('cursor-ready'); }
    });
    function animateCursor(){
      var ease = reducedMotion ? 1 : 0.16;
      ringX += (mouseX - ringX) * ease; ringY += (mouseY - ringY) * ease;
      cursorRing.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px) translate(-50%,-50%)';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();
  
    function wireHoverTargets(root){
      root.querySelectorAll('a, button, .project-card, .modal-close').forEach(function(el){
        el.addEventListener('mouseenter', function(){ cursorRing.classList.add('is-hover'); });
        el.addEventListener('mouseleave', function(){ cursorRing.classList.remove('is-hover'); });
      });
    }
  
    carouselStage.addEventListener('mouseenter', function(){
      cursorRing.classList.add('is-drag'); carouselHint.classList.add('is-active');
      carouselHint.textContent = isCoarsePointer ? 'Swipe left or right to spin the architecture models.' : 'Scroll to spin. Click a card for details.';
    });
    carouselStage.addEventListener('mouseleave', function(){
      cursorRing.classList.remove('is-drag'); carouselHint.classList.remove('is-active');
      carouselHint.textContent = isCoarsePointer ? 'Swipe on the cards above to spin.' : 'Hover here, then scroll to spin. Click a card for architecture details.';
    });
  
    /* --- Projects Carousel --- */
    var total = PROJECTS.length, cardEls = [], carouselRotation = 0, carouselTarget = 0;
    function setResponsiveRadius(){
      var w = window.innerWidth; 
      // Reduced radius for smaller screens to prevent overlapping or clipping
      var radius = w < 640 ? 200 : (w < 1000 ? 320 : 450);
      document.documentElement.style.setProperty('--radius', radius + 'px');
    }
    setResponsiveRadius();
  
    PROJECTS.forEach(function(p, i){
      var card = document.createElement('div'); card.className = 'project-card';
      card.style.setProperty('--i', i); card.style.setProperty('--total', total);
      card.style.setProperty('--card-accent', SIGNAL_COLORS[i % SIGNAL_COLORS.length]);
      card.innerHTML = `
        <div>
          <h3>${p.title}</h3>
          <p>${p.desc}</p>
          <div class="tags">${p.tags.map(t=>`<span>${t}</span>`).join('')}</div>
        </div>
        <div class="view-more">View Architecture +</div>
      `;
      
      card.addEventListener('mouseenter', function(){ card.style.setProperty('--hover-boost', '1.05'); sfx.hover(); });
      card.addEventListener('mouseleave', function(){ card.style.setProperty('--hover-boost', '1'); });
      
      // Open Modal Logic
      card.addEventListener('click', function(){
        sfx.click();
        modalTitle.textContent = p.title;
        modalTags.innerHTML = p.tags.map(t=>`<span>${t}</span>`).join('');
        modalDesc.innerHTML = p.fullDesc;
        projectModal.classList.add('active');
      });
  
      carouselEl.appendChild(card); cardEls.push(card);
    });
    carouselEl.style.setProperty('--total', total);
    wireHoverTargets(document);
  
    // Close Modal Logic
    modalClose.addEventListener('click', function(){
      projectModal.classList.remove('active');
    });
    projectModal.addEventListener('click', function(e){
      if(e.target === projectModal) { projectModal.classList.remove('active'); }
    });
  
    // Scroll-Hijacking in the Carousel Box (Desktop)
    carouselStage.addEventListener('wheel', function(e){
      e.preventDefault();
      var prev = carouselTarget;
      carouselTarget += e.deltaY * 0.22;
      if (Math.floor(carouselTarget/(360/total)) !== Math.floor(prev/(360/total))) sfx.tick();
    }, { passive: false });
  
    // Mobile Swipe Logic for Carousel
    var touchStartX = null;
    var touchStartY = null;
  
    carouselStage.addEventListener('touchstart', function(e){
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
  
    carouselStage.addEventListener('touchmove', function(e){
      if (!touchStartX || !touchStartY) return;
  
      var touchCurrentX = e.touches[0].clientX;
      var touchCurrentY = e.touches[0].clientY;
      
      var dx = touchStartX - touchCurrentX;
      var dy = touchStartY - touchCurrentY;
  
      // Detect if swipe is mostly horizontal
      if (Math.abs(dx) > Math.abs(dy)) {
        var prev = carouselTarget;
        // Rotate carousel Target based on horizontal swipe delta
        carouselTarget += dx * 0.4;
        if (Math.floor(carouselTarget/(360/total)) !== Math.floor(prev/(360/total))) sfx.tick();
        
        // Reset start coordinates to continue smooth tracking during a single long swipe
        touchStartX = touchCurrentX;
        touchStartY = touchCurrentY;
      }
    }, { passive: true });
  
    carouselStage.addEventListener('touchend', function(){
      touchStartX = null;
      touchStartY = null;
    });
  
    function animateCarousel(){
      carouselRotation += (carouselTarget - carouselRotation) * (reducedMotion ? 0.35 : 0.08);
      carouselEl.style.transform = 'rotateY(' + carouselRotation + 'deg)';
      
      for (var i = 0; i < cardEls.length; i++) {
        var rad = (carouselRotation + (i * 360/total)) * Math.PI/180;
        var focus = Math.max(0, Math.cos(rad));
        cardEls[i].style.setProperty('--card-scale', (0.62 + 0.38*focus).toFixed(3));
        cardEls[i].style.opacity = focus.toFixed(3);
        // Ensure front cards are clickable
        cardEls[i].style.zIndex = Math.round(focus*100);
        cardEls[i].style.pointerEvents = focus > 0.8 ? 'auto' : 'none';
      }
      requestAnimationFrame(animateCarousel);
    }
  
    /* --- Three.js Background (Vibrant AI w/ Mouse Parallax) --- */
    var scene, camera, renderer, particles;
    var targetCamX = 0, targetCamY = 0; 
    
    function initThree(){
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x030308, 0.12);
      camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 100);
      camera.position.z = 6;
      renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg-canvas'), alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
  
      var count = reducedMotion ? 700 : 2500, positions = new Float32Array(count*3);
      for (var i = 0; i < count; i++) {
        var r = 3.5 + Math.random()*7.5, theta = Math.random()*Math.PI*2, phi = Math.acos((Math.random()*2)-1);
        positions[i*3] = r*Math.sin(phi)*Math.cos(theta); positions[i*3+1] = r*Math.sin(phi)*Math.sin(theta); positions[i*3+2] = r*Math.cos(phi) - 2;
      }
      var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      // Vibrant particle material
      var mat = new THREE.PointsMaterial({ 
        color: 0x9d00ff, 
        size: 0.035, 
        transparent: true, 
        opacity: 0.8, 
        blending: THREE.AdditiveBlending 
      });
      particles = new THREE.Points(geo, mat); scene.add(particles);
  
      // Track mouse position for parallax effect (Desktop)
      window.addEventListener('mousemove', function(e){
        targetCamX = (e.clientX / window.innerWidth - 0.5) * 1.5;
        targetCamY = -(e.clientY / window.innerHeight - 0.5) * 1.5;
      });
    }
  
    function animateThree(){
      particles.rotation.y += 0.0008;
      particles.rotation.x += 0.0003;
      
      // Mouse Parallax effect logic
      if (!reducedMotion) {
        camera.position.x += (targetCamX - camera.position.x) * 0.03;
        camera.position.y += (targetCamY - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);
      }
  
      // Shift color based on scroll progression
      var scrollRatio = scrollContainer.scrollTop / (scrollContainer.scrollHeight - scrollContainer.clientHeight) || 0;
      particles.material.color.lerpColors(new THREE.Color(0x9d00ff), new THREE.Color(0x00e5ff), scrollRatio);
      
      renderer.render(scene, camera);
      requestAnimationFrame(animateThree);
    }
    
    window.addEventListener('resize', function(){
      if(camera && renderer) {
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        setResponsiveRadius();
      }
    });
  
    /* --- Initialization --- */
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          var idx = sections.indexOf(entry.target);
          dots.forEach(function(d, i){ d.classList.toggle('active', i === idx); });
          if (idx === 2) carouselStage.classList.add('revealed');
        }
      });
    }, { threshold: 0.6 });
    sections.forEach(function(s){ io.observe(s); });
  
    // Try to boot Three.js, but gracefully degrade if it fails
    try {
      if (typeof THREE !== 'undefined') {
        initThree(); 
        animateThree(); 
      } else {
        console.warn("Three.js did not load. Running without 3D background.");
      }
    } catch(e) {
      console.error("WebGL Error:", e);
    }
    
    animateCarousel();
  
  })();