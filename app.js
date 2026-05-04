// ==================== STARS BACKGROUND ====================
(function() {
  const canvas = document.getElementById('stars-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, stars = [], mouse = { x: 0, y: 0 }, t = 0;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createStars(n) {
    stars = [];
    for (let i = 0; i < n; i++) {
      const layer = Math.random() * 0.8 + 0.2;
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.3 + 0.2,
        alpha: Math.random() * 0.8 + 0.3,
        speed: Math.random() * 0.015 + 0.005,
        phase: Math.random() * Math.PI * 2,
        layer: layer
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.016;
    const scrollY = window.scrollY;

    stars.forEach(s => {
      const twinkle = Math.sin(t * s.speed * 60 + s.phase) * 0.3 + 0.7;
      const px = (mouse.x - W / 2) * s.layer * 0.015;
      const py = (mouse.y - H / 2) * s.layer * 0.015 - scrollY * s.layer * 0.06;

      ctx.beginPath();
      ctx.arc(s.x + px, s.y + py, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.alpha * twinkle})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); createStars(280); });
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  resize();
  createStars(280);
  draw();
})();

// ==================== SCROLL REVEAL ====================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.15 });

// ==================== LOAD & RENDER DATA ====================
async function loadData() {
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error();
    const data = await res.json();
    renderAll(data);
  } catch (err) {
    console.error('Unable to load data.json', err);
  }
}

function renderAll(data) {
  const p = data.personal;
  const cvLink = document.getElementById('cv-link');
  if (cvLink && p.cv) {
    cvLink.href = p.cv;
  }

  // Hero
  const heroNameEl = document.getElementById('hero-name');
  const nameParts = p.name.split(' ');
  heroNameEl.innerHTML = `${nameParts.slice(0, -1).join(' ')} <span class="glow-text">${nameParts.pop()}</span>`;
  document.getElementById('hero-title').textContent = `${p.title} · ${p.subtitle || ''}`;
  document.getElementById('hero-about').textContent = p.about;
  document.title = `${p.name} · Portfolio`;

  // Avatar
  const avatarEl = document.getElementById('hero-avatar-el');
  if (p.avatar) {
    avatarEl.innerHTML = `<img src="${p.avatar}" alt="${p.name}">`;
  }

  // Render sections
  renderEducation(p.education || data.education || []);
  renderSkills(p.skills || data.skills || {});
  renderProjects(p.projects || data.projects || []);
  renderBlog(p.blog || data.blog || []);
  renderExperience(p.experience || data.experience || []);
  renderContact(p);

  // Footer
  const year = new Date().getFullYear();
  document.getElementById('footer-text').textContent = `© ${year} ${p.name} · Built with passion, deployed to the stars.`;

  // Observe reveals
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  // Ensure hero CTA buttons share the same width as the primary button
  if (typeof equalizeHeroButtons === 'function') equalizeHeroButtons();
}

function renderBlog(posts) {
  const container = document.getElementById('blog-grid');
  if (!container) return;
  container.innerHTML = '';
  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'glass-card blog-card';

    // Image (with error handling / placeholder)
    if (post.image) {
      const img = document.createElement('img');
      img.className = 'blog-image';
      img.alt = post.title;
      img.src = post.image;
      img.addEventListener('error', () => {
        post.image = '';
        const ph = document.createElement('div');
        ph.className = 'blog-placeholder';
        ph.textContent = 'No image available';
        if (img && img.parentNode) img.parentNode.replaceChild(ph, img);
      });
      card.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'blog-placeholder';
      ph.textContent = 'No image available';
      card.appendChild(ph);
    }

    const contentWrap = document.createElement('div');
    const meta = document.createElement('div');
    meta.className = 'blog-meta';
    meta.textContent = `${post.tags ? post.tags.join(' · ') : ''}${post.tags && post.date ? ' · ' : ''}${post.date || ''}`;

    const title = document.createElement('div');
    title.className = 'blog-title';
    title.textContent = post.title;

    const excerpt = document.createElement('div');
    excerpt.className = 'blog-excerpt';
    excerpt.innerHTML = post.excerpt || '';

    const actions = document.createElement('div');
    actions.style.marginTop = '12px';
    actions.innerHTML = `<a href="#" class="project-link view-more" data-id="${post.id}">View more →</a>`;

    contentWrap.appendChild(meta);
    contentWrap.appendChild(title);
    contentWrap.appendChild(excerpt);
    contentWrap.appendChild(actions);
    card.appendChild(contentWrap);

    container.appendChild(card);
  });

  // attach handlers (delegated)
  container.querySelectorAll('.view-more').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      const post = posts.find(p => p.id === id);
      if (post) showPostModal(post);
    });
  });
}

function showPostModal(post) {
  const modal = document.getElementById('post-modal');
  const contentEl = document.getElementById('post-modal-content');
  if (!modal || !contentEl) return;
  // Build DOM to attach image error handler
  contentEl.innerHTML = '<div class="post-body">Loading...</div>';
  if (post.image) {
    const img = document.createElement('img');
    img.src = post.image;
    img.alt = post.title;
    img.addEventListener('error', () => {
      post.image = '';
      const ph = document.createElement('div');
      ph.className = 'blog-placeholder';
      ph.style.height = '220px';
      ph.textContent = 'No image available';
      if (img && img.parentNode) img.parentNode.replaceChild(ph, img);
    });
    contentEl.appendChild(img);
  }
  const t = document.createElement('div'); t.className = 'post-title'; t.textContent = post.title; contentEl.appendChild(t);
  const d = document.createElement('div'); d.className = 'post-date'; d.textContent = post.date || ''; contentEl.appendChild(d);
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');

  loadPostBody(post).then((bodyHtml) => {
    const existingBody = contentEl.querySelector('.post-body');
    if (existingBody) existingBody.remove();
    const bodyEl = document.createElement('div');
    bodyEl.className = 'post-body';
    bodyEl.innerHTML = bodyHtml;
    contentEl.appendChild(bodyEl);
  }).catch(() => {
    const existingBody = contentEl.querySelector('.post-body');
    if (existingBody) existingBody.textContent = 'Unable to load post content.';
  });
}

async function loadPostBody(post) {
  if (post.contentFile) {
    const res = await fetch(post.contentFile);
    if (!res.ok) throw new Error('Failed to load post content file');
    const markdown = await res.text();
    return renderMarkdown(markdown);
  }

  return post.content || '';
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let listType = null;
  let listItems = [];

  const flushList = () => {
    if (!listType || !listItems.length) return;
    const tag = listType === 'ol' ? 'ol' : 'ul';
    html.push(`<${tag}>${listItems.map(item => `<li>${formatInlineMarkdown(item)}</li>`).join('')}</${tag}>`);
    listType = null;
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }

    if (line.startsWith('# ')) {
      flushList();
      html.push(`<h1>${formatInlineMarkdown(line.slice(2))}</h1>`);
      continue;
    }

    if (line.startsWith('## ')) {
      flushList();
      html.push(`<h2>${formatInlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith('- ')) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(line.slice(2).trim());
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(line.replace(/^\d+\.\s+/, '').trim());
      continue;
    }

    flushList();
    html.push(`<p>${formatInlineMarkdown(line)}</p>`);
  }

  flushList();
  return html.join('\n');
}

function formatInlineMarkdown(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function closePostModal() {
  const modal = document.getElementById('post-modal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

// modal close listeners
window.addEventListener('load', () => {
  const closeBtn = document.getElementById('modal-close');
  const modal = document.getElementById('post-modal');
  if (closeBtn) closeBtn.addEventListener('click', closePostModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closePostModal(); });
});

function renderEducation(education) {
  const container = document.getElementById('education-list');
  container.innerHTML = '';
  education.forEach(edu => {
    const div = document.createElement('div');
    div.className = 'glass-card';
    const hasGpa = edu.gpa !== null
      && edu.gpa !== undefined
      && String(edu.gpa).trim() !== ''
      && String(edu.gpa).trim().toLowerCase() !== 'null';
    const gpaHTML = hasGpa ? `
      <div>
        <div class="edu-gpa">${edu.gpa}</div>
        <div style="font-size:0.7rem; color:var(--text-muted); text-align:right;">GPA</div>
      </div>` : '';

    div.innerHTML = `
      <div class="edu-inner">
        <div>
          <div style="font-size:1.15rem; font-weight:700;">${edu.school}</div>
          <div style="color:var(--text-muted); margin:6px 0;">${edu.degree}</div>
          <div style="font-family:var(--font-mono); font-size:0.8rem; color:var(--text-muted);">${edu.period}</div>
          ${edu.link ? `<a href="${edu.link}" class="project-link" target="_blank" rel="noopener" style="margin-top:12px; display:inline-block;">View proof →</a>` : ''}
        </div>
        ${gpaHTML}
      </div>
    `;
    container.appendChild(div);
  });
}

function renderSkills(skills) {
  const langContainer = document.getElementById('lang-tags');
  const dbContainer = document.getElementById('database-tags');
  const cloudContainer = document.getElementById('cloud-tags');
  const toolContainer = document.getElementById('tool-tags');

  langContainer.innerHTML = skills.languages.map(lang => `<span class="skill-tag">${lang}</span>`).join('');
  dbContainer.innerHTML = skills.databases.map(database => `<span class="skill-tag database">${database}</span>`).join('');
  cloudContainer.innerHTML = skills.cloud.map(cloud => `<span class="skill-tag">${cloud}</span>`).join('');
  toolContainer.innerHTML = skills.tools.map(tool => `<span class="skill-tag tool">${tool}</span>`).join('');
}

function renderProjects(projects) {
  const container = document.getElementById('projects-grid');
  container.innerHTML = '';
  projects.forEach(proj => {
    const card = document.createElement('div');
    card.className = 'glass-card';
    const techHTML = proj.tech.map(t => `<span class="tech-badge">${t}</span>`).join('');

    card.innerHTML = `
      <div class="project-header">
        <div class="project-title">${proj.title}</div>
        <div class="project-period">${proj.period}</div>
      </div>
      <div class="project-type">${proj.type}</div>
      <p class="project-desc">${proj.description}</p>
      <div class="project-tech">${techHTML}</div>
      <a href="${proj.link}" class="project-link" target="_blank" rel="noopener">View project →</a>
    `;
    container.appendChild(card);
  });
}

function renderExperience(experience) {
  const container = document.getElementById('experience-list');
  container.innerHTML = '';
  experience.forEach(exp => {
    const card = document.createElement('div');
    card.className = 'glass-card exp-card';

    const linkHTML = exp.link ? `
      <div style="margin-top:16px;">
        <a href="${exp.link}" class="project-link" target="_blank" rel="noopener">View proof →</a>
      </div>` : '';

    card.innerHTML = `
      <div class="exp-role">${exp.role}</div>
      <div class="exp-meta">
        <span class="exp-org">${exp.org}</span>
        <span style="color:var(--text-muted);">•</span>
        <span class="exp-period">${exp.period}</span>
      </div>
      <p style="color:var(--text-muted);">${exp.description}</p>
      ${linkHTML}
    `;
    container.appendChild(card);
  });
}

function renderContact(personal) {
  const container = document.getElementById('contact-links');
  container.innerHTML = `
    <a href="mailto:${personal.email}" class="contact-link">
      <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-muted);">EMAIL</div>
      <div style="margin-top:4px;">${personal.email}</div>
    </a>
    <a href="${personal.github}" target="_blank" rel="noopener" class="contact-link">
      <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-muted);">GITHUB</div>
      <div style="margin-top:4px;">github.com/HaoWasabi</div>
    </a>
    <a href="${personal.linkedin}" target="_blank" rel="noopener" class="contact-link">
      <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-muted);">LINKEDIN</div>
      <div style="margin-top:4px;">linkedin.com/in/hao-truong</div>
    </a>
  `;
}

function equalizeHeroButtons() {
  try {
    const cta = document.querySelector('.hero-cta');
    if (!cta) return;
    const primary = cta.querySelector('.btn-primary');
    if (!primary) return;
    const buttons = Array.from(cta.querySelectorAll('.btn'));
    // Reset inline widths so measurement is accurate
    buttons.forEach(b => { b.style.width = ''; });
    const refWidth = Math.ceil(primary.getBoundingClientRect().width);
    buttons.forEach(b => { b.style.width = refWidth + 'px'; });
  } catch (e) {
    // Non-critical, ignore
  }
}

// Recalc when viewport changes
window.addEventListener('resize', () => { equalizeHeroButtons(); });

// Khởi chạy
window.addEventListener('load', loadData);