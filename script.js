(() => {
  'use strict';

  const GRAD_WIDTH = 1198, GRAD_HEIGHT = 1313;
  const CAL_WIDTH = 1200, CAL_HEIGHT = 1700;
  const EXPORT_SCALE = 3;

  const defaults = Object.freeze({
    name: 'Bonolo Makola',
    dob: '2021-08-18',
    gender: 'Male',
    year: '2026',
    dream: 'Doctor',
    teacher: 'Teacher Thandi',
    memory: 'Storytime, Building Blocks & Sports Day',
    blessing: 'A bright beginning for a brighter future! May your journey ahead be filled with curiosity, courage, and endless joy.'
  });

  const photoBox = Object.freeze({ x: 319, y: 394, w: 557, h: 635 });
  const calPhotoBox = Object.freeze({ x: 410, y: 215, w: 380, h: 415 });

  const MONTH_NAMES = Object.freeze([
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ]);
  const WEEKDAY_NAMES = Object.freeze(['S', 'M', 'T', 'W', 'T', 'F', 'S']);

  const $ = id => document.getElementById(id);

  const form = $('student-form');
  const stage = $('poster-stage');
  const bookStage = $('book-stage');
  const aiStage = $('ai-stage');
  const gradCard = $('graduation-card');
  const calCard = $('calendar-card');

  // Tabs
  const tabs = {
    graduation: $('tab-graduation'),
    calendar: $('tab-calendar'),
    book: $('tab-book'),
    ai: $('tab-ai')
  };

  const fields = {
    name: $('student-name'),
    dob: $('student-dob'),
    gender: $('student-gender'),
    year: $('calendar-year'),
    dream: $('student-dream'),
    teacher: $('teacher-name'),
    memory: $('favorite-memory'),
    blessing: $('custom-blessing')
  };

  const gradLabels = {
    name: $('name-label'),
    dob: $('dob-label'),
    gender: $('gender-label')
  };

  const calLabels = {
    name: $('cal-name-label'),
    dob: $('cal-dob-label'),
    gender: $('cal-gender-label')
  };

  const photoControls = {
    x: $('photo-x'),
    y: $('photo-y'),
    zoom: $('photo-zoom')
  };

  const textBoxes = {
    name: { x: 316, y: 1047, w: 566, h: 74 },
    dob: { x: 390, y: 1140, w: 185, h: 39 },
    gender: { x: 688, y: 1140, w: 195, h: 39 }
  };

  const measureContext = document.createElement('canvas').getContext('2d');

  let currentMode = 'graduation'; // 'graduation' | 'calendar' | 'book' | 'ai'
  let currentSpread = 0;
  const TOTAL_SPREADS = 5;

  let sourceImage, artworkImage, originalPortrait, portraitImage, ready = false;
  let crecheLogoImg, limpopoLogoImg;
  let leftQuoteImg, rightQuoteImg;
  let uploadRevision = 0, dragStart = null;
  const defaultTextCrops = {};

  function status(message, isError = false) {
    const el = $('status');
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('error', isError);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('The image could not be opened. Please use a JPG, PNG or WebP photo.'));
      img.src = src;
    });
  }

  function makeCanvas(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
  }

  function cropReference(box) {
    const canvas = makeCanvas(box.w, box.h);
    canvas.getContext('2d').drawImage(sourceImage, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
    return canvas.toDataURL('image/png');
  }

  function portraitPath(w = 557, h = 635) {
    const path = new Path2D();
    const cornerW = Math.round(w * 0.061);
    const cornerH = Math.round(h * 0.0535);

    path.moveTo(cornerW, 0);
    path.lineTo(w - cornerW, 0);
    path.bezierCurveTo(w - cornerW * 0.8, cornerH * 0.55, w - cornerW * 0.45, cornerH * 0.85, w, cornerH);
    path.lineTo(w, h - cornerH);
    path.bezierCurveTo(w - cornerW * 0.45, h - cornerH * 0.85, w - cornerW * 0.8, h - cornerH * 0.55, w - cornerW, h);
    path.lineTo(cornerW, h);
    path.bezierCurveTo(cornerW * 0.8, h - cornerH * 0.55, cornerW * 0.45, h - cornerH * 0.85, 0, h - cornerH);
    path.lineTo(0, cornerH);
    path.bezierCurveTo(cornerW * 0.45, cornerH * 0.85, cornerW * 0.8, cornerH * 0.55, cornerW, 0);
    path.closePath();
    return path;
  }

  function prepareArtwork() {
    const canvas = makeCanvas(GRAD_WIDTH, GRAD_HEIGHT);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(sourceImage, 0, 0);
    const original = ctx.getImageData(0, 0, GRAD_WIDTH, GRAD_HEIGHT);
    const cleaned = ctx.getImageData(0, 0, GRAD_WIDTH, GRAD_HEIGHT);
    const pixel = (x, y, c) => original.data[(y * GRAD_WIDTH + x) * 4 + c];

    function clearLettering(x, y, w, h, mode) {
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
          const index = (yy * GRAD_WIDTH + xx) * 4;
          for (let c = 0; c < 3; c++) {
            let colour;
            if (mode === 'ribbon') {
              const t = (xx - x) / w;
              let left = 0, right = 0;
              for (let k = 0; k < 12; k++) {
                left += pixel(343 + k, yy, c);
                right += pixel(842 + k, yy, c);
              }
              colour = (left / 12) * (1 - t) + (right / 12) * t;
              colour += (pixel(331 + (xx % 20), yy, c) - left / 12) * 0.3;
            } else {
              const t = (yy - y) / h;
              colour = pixel(xx, y - 6, c) * (1 - t) + pixel(xx, y + h + 6, c) * t;
            }
            const feather = Math.min(1, (xx - x + 1) / 4, (x + w - xx) / 4, (yy - y + 1) / 4, (y + h - yy) / 4);
            cleaned.data[index + c] = Math.round(colour * feather + original.data[index + c] * (1 - feather));
          }
        }
      }
    }
    clearLettering(369, 1050, 459, 62, 'ribbon');
    clearLettering(388, 1144, 182, 30, 'paper');
    clearLettering(686, 1144, 151, 30, 'paper');
    ctx.putImageData(cleaned, 0, 0);

    ctx.save();
    ctx.translate(photoBox.x, photoBox.y);
    ctx.clip(portraitPath(photoBox.w, photoBox.h));
    ctx.fillStyle = '#fcfaf0';
    ctx.fillRect(0, 0, photoBox.w, photoBox.h);
    ctx.restore();

    return canvas.toDataURL('image/png');
  }

  function displayDob(value) {
    if (!value) return '';
    const parts = value.split('-');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : value;
  }

  function currentText() {
    return {
      name: (fields.name ? fields.name.value.trim() : '') || 'Student',
      dob: `DOB: ${displayDob(fields.dob ? fields.dob.value : '')}`,
      gender: `Gender: ${(fields.gender ? fields.gender.value.trim() : '') || 'Male'}`
    };
  }

  function isDefault(key) {
    return fields[key] && fields[key].value === defaults[key];
  }

  function fontFor(key, text) {
    const base = key === 'name' ? 68 : 26;
    const weight = key === 'name' ? '700' : '400';
    measureContext.font = `${weight} ${base}px "Times New Roman", Times, serif`;
    const maxWidth = key === 'name' ? 526 : textBoxes[key].w;
    const width = measureContext.measureText(text).width;
    const size = width > maxWidth ? base * maxWidth / width : base;
    return { size, weight, font: `${weight} ${size}px "Times New Roman", Times, serif` };
  }

  function calFontForName(text, maxWidth = 580) {
    const base = 34;
    measureContext.font = `bold ${base}px "Times New Roman", Times, serif`;
    const width = measureContext.measureText(text).width;
    const size = width > maxWidth ? Math.max(18, base * maxWidth / width) : base;
    return { size, font: `bold ${size}px "Times New Roman", Times, serif` };
  }

  function updateText() {
    const text = currentText();

    // 1. Graduation Card
    for (const key of Object.keys(gradLabels)) {
      const label = gradLabels[key];
      if (!label) continue;
      label.textContent = text[key];
      label.style.fontSize = `${fontFor(key, text[key]).size}px`;
      label.style.backgroundImage = isDefault(key) && ready ? `url("${defaultTextCrops[key].src}")` : 'none';
      label.style.color = isDefault(key) && ready ? 'transparent' : key === 'name' ? '#fffdf4' : '#002d1c';
      label.style.textShadow = key === 'name' && !isDefault(key) ? '1px 2px 2px #002918' : 'none';
    }

    // 2. Calendar Card
    if (calLabels.name) {
      calLabels.name.textContent = text.name;
      const calFont = calFontForName(text.name);
      calLabels.name.style.fontSize = `${calFont.size}px`;
    }
    if (calLabels.dob) calLabels.dob.textContent = `📅  ${text.dob}`;
    if (calLabels.gender) calLabels.gender.textContent = `👤  ${text.gender}`;

    // 3. Memory Book
    if ($('book-cover-name')) $('book-cover-name').textContent = text.name;
    if ($('book-p1-name')) $('book-p1-name').textContent = text.name;
    if ($('book-p1-meta')) $('book-p1-meta').textContent = `${text.dob} · ${text.gender.replace('Gender: ', '')}`;
    if ($('book-cert-name')) $('book-cert-name').textContent = text.name;

    const teacher = fields.teacher ? fields.teacher.value.trim() : defaults.teacher;
    if ($('book-teacher-sign')) $('book-teacher-sign').textContent = teacher;

    const dream = fields.dream ? fields.dream.value.trim() : defaults.dream;
    if ($('book-dream-display')) $('book-dream-display').textContent = dream;

    const mem = fields.memory ? fields.memory.value.trim() : defaults.memory;
    if ($('book-memory-display')) $('book-memory-display').textContent = mem;

    const blessing = fields.blessing ? fields.blessing.value.trim() : defaults.blessing;
    if ($('book-teacher-blessing-text')) {
      $('book-teacher-blessing-text').textContent = `"${blessing} — ${teacher}"`;
    }

    const studentName = fields.name.value.trim() || 'student';
    gradCard.setAttribute('aria-label', `Dream Big Crèche graduation keepsake for ${studentName}`);
    calCard.setAttribute('aria-label', `Dream Big Crèche ${fields.year ? fields.year.value : '2026'} student calendar for ${studentName}`);
    $('student-portrait').alt = `${studentName}'s graduation portrait`;
    $('cal-student-portrait').alt = `${studentName}'s calendar portrait`;
  }

  function updatePhoto() {
    const x = `${photoControls.x.value}%`;
    const y = `${photoControls.y.value}%`;
    const zoom = Number(photoControls.zoom.value) / 100;

    const portraits = [$('student-portrait'), $('cal-student-portrait'), $('book-portrait-img')];
    for (const img of portraits) {
      if (!img) continue;
      img.style.setProperty('--photo-x', x);
      img.style.setProperty('--photo-y', y);
      img.style.setProperty('--photo-zoom', zoom);
    }
  }

  function resetPhotoPosition() {
    photoControls.x.value = '50';
    photoControls.y.value = '50';
    photoControls.zoom.value = '100';
    updatePhoto();
  }

  function updateCalendarGrid(year) {
    const grid = $('cal-months-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const y = parseInt(year, 10) || 2026;
    $('cal-title-year').textContent = y;
    $('cal-academic-badge').textContent = `✦  ${y} ACADEMIC YEAR  ✦`;

    for (let m = 0; m < 12; m++) {
      const card = document.createElement('div');
      card.className = 'cal-month-card';

      const header = document.createElement('div');
      header.className = 'cal-month-header';
      header.textContent = MONTH_NAMES[m];
      card.appendChild(header);

      const weekdays = document.createElement('div');
      weekdays.className = 'cal-weekdays-row';
      for (let w = 0; w < 7; w++) {
        const span = document.createElement('span');
        span.className = `cal-day-name ${w === 0 ? 'sun' : ''}`;
        span.textContent = WEEKDAY_NAMES[w];
        weekdays.appendChild(span);
      }
      card.appendChild(weekdays);

      const datesGrid = document.createElement('div');
      datesGrid.className = 'cal-dates-grid';

      const firstDay = new Date(y, m, 1).getDay();
      const daysInMonth = new Date(y, m + 1, 0).getDate();

      for (let b = 0; b < firstDay; b++) {
        const empty = document.createElement('span');
        empty.className = 'cal-date-cell empty';
        datesGrid.appendChild(empty);
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const isSun = ((firstDay + d - 1) % 7) === 0;
        const cell = document.createElement('span');
        cell.className = `cal-date-cell ${isSun ? 'sun' : ''}`;
        cell.textContent = d;
        datesGrid.appendChild(cell);
      }

      card.appendChild(datesGrid);
      grid.appendChild(card);
    }

    // Also populate Memory Book calendar spreads
    populateBookCalendar(y);
  }

  function populateBookCalendar(y) {
    const h1 = $('book-cal-h1');
    const h2 = $('book-cal-h2');
    if (!h1 || !h2) return;
    h1.innerHTML = '';
    h2.innerHTML = '';

    function buildMiniMonth(m) {
      const box = document.createElement('div');
      box.style.cssText = 'background: white; border: 1px solid #dcd3c1; border-radius: 4px; padding: 6px; margin-bottom: 8px; font-size: 10px;';
      box.innerHTML = `<strong style="display:block; text-align:center; color:#063e28; margin-bottom:3px; border-bottom:1px solid #ebd9a8; padding-bottom:2px;">${MONTH_NAMES[m]}</strong>
      <div style="display:grid; grid-template-columns:repeat(7,1fr); text-align:center; font-weight:bold; color:#718075; font-size:9px;">
        <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
      </div>`;
      return box;
    }

    for (let m = 0; m < 6; m++) h1.appendChild(buildMiniMonth(m));
    for (let m = 6; m < 12; m++) h2.appendChild(buildMiniMonth(m));
  }

  function fitStage() {
    if (currentMode === 'calendar') {
      calCard.style.setProperty('--calendar-scale', stage.clientWidth / CAL_WIDTH);
    } else if (currentMode === 'graduation') {
      gradCard.style.setProperty('--poster-scale', stage.clientWidth / GRAD_WIDTH);
    }
  }

  function setMode(mode) {
    currentMode = mode;

    for (const key of Object.keys(tabs)) {
      if (!tabs[key]) continue;
      const isActive = key === mode;
      tabs[key].classList.toggle('active', isActive);
      tabs[key].setAttribute('aria-selected', isActive);
    }

    // Visibility toggles
    const isGrad = mode === 'graduation';
    const isCal = mode === 'calendar';
    const isBook = mode === 'book';
    const isAI = mode === 'ai';

    stage.classList.toggle('mode-hidden', isBook || isAI);
    bookStage.classList.toggle('active', isBook);
    aiStage.classList.toggle('active', isAI);

    gradCard.hidden = !isGrad;
    calCard.hidden = !isCal;
    stage.classList.toggle('mode-calendar', isCal);

    $('calendar-year-group').style.display = isCal ? 'block' : 'none';
    $('memory-book-fields').style.display = (isBook || isAI) ? 'block' : 'none';

    // Titles & Note text
    if (isGrad) {
      $('preview-title').textContent = 'Live preview · Graduation Keepsake';
      $('preview-sub').textContent = 'Original portrait proportions (1198 × 1313)';
      $('download').textContent = 'Download Keepsake PNG';
      $('export-note-text').innerHTML = 'High-resolution PNG · 3594 × 3939 px<br>Only the keepsake is included in your download.';
    } else if (isCal) {
      $('preview-title').textContent = 'Live preview · Student Calendar';
      $('preview-sub').textContent = '1200 × 1700 (A-series Wall Poster)';
      $('download').textContent = 'Download Calendar PNG';
      $('export-note-text').innerHTML = 'High-resolution PNG · 3600 × 5100 px (300 DPI Print Quality)<br>Only the calendar is included in your download.';
    } else if (isBook) {
      $('preview-title').textContent = 'Live preview · 3D Memory Book';
      $('preview-sub').textContent = 'Tactile page-turning digital album by MEMORIQ';
      $('download').textContent = 'Print / Save Memory Book';
      $('export-note-text').innerHTML = 'Interactive multi-page keepsake with scannable digital QR plaque.';
    } else if (isAI) {
      $('preview-title').textContent = 'Memoriq AI Studio ("Plus You")';
      $('preview-sub').textContent = 'AI Generation Co-Pilot';
      $('download').textContent = 'Download Keepsake PNG';
    }

    requestAnimationFrame(fitStage);
  }

  // 3D Flipbook navigation
  function showSpread(index) {
    currentSpread = Math.max(0, Math.min(TOTAL_SPREADS - 1, index));
    for (let s = 0; s < TOTAL_SPREADS; s++) {
      const el = $(`spread-${s}`);
      if (el) el.style.display = s === currentSpread ? (s === 0 ? 'flex' : 'grid') : 'none';
    }

    const counter = $('book-counter');
    const titles = [
      'Cover',
      'Pages 2–3: Certificate',
      'Pages 4–5: Memories & Dreams',
      'Pages 6–7: Calendar',
      'Pages 8–9: Digital Plaque'
    ];
    if (counter) counter.textContent = `${titles[currentSpread]} (${currentSpread + 1} of ${TOTAL_SPREADS})`;

    $('book-prev').disabled = currentSpread === 0;
    $('book-next').disabled = currentSpread === TOTAL_SPREADS - 1;
  }

  if ($('book-prev')) $('book-prev').addEventListener('click', () => showSpread(currentSpread - 1));
  if ($('book-next')) $('book-next').addEventListener('click', () => showSpread(currentSpread + 1));

  // Canvas drawing functions
  function drawPortrait(ctx) {
    const { x, y, w, h } = photoBox;
    const zoom = Number(photoControls.zoom.value) / 100;
    const px = Number(photoControls.x.value) / 100, py = Number(photoControls.y.value) / 100;
    const cover = Math.max(w / portraitImage.naturalWidth, h / portraitImage.naturalHeight) * zoom;
    const dw = portraitImage.naturalWidth * cover, dh = portraitImage.naturalHeight * cover;
    ctx.save();
    ctx.translate(x, y);
    ctx.clip(portraitPath(w, h));
    ctx.drawImage(portraitImage, (w - dw) * px, (h - dh) * py, dw, dh);
    ctx.restore();
  }

  function drawCalendarPortrait(ctx, x, y, w, h) {
    const zoom = Number(photoControls.zoom.value) / 100;
    const px = Number(photoControls.x.value) / 100, py = Number(photoControls.y.value) / 100;

    ctx.save();
    ctx.translate(x - 6, y - 6);
    const fw = w + 12, fh = h + 12;
    const frameGrad = ctx.createLinearGradient(0, 0, fw, fh);
    frameGrad.addColorStop(0, '#d8b467');
    frameGrad.addColorStop(0.5, '#bd913e');
    frameGrad.addColorStop(1, '#906c27');
    ctx.fillStyle = frameGrad;
    ctx.fill(portraitPath(fw, fh));
    ctx.restore();

    ctx.save();
    ctx.translate(x, y);
    ctx.clip(portraitPath(w, h));
    ctx.fillStyle = '#fcfaf0';
    ctx.fillRect(0, 0, w, h);

    const cover = Math.max(w / portraitImage.naturalWidth, h / portraitImage.naturalHeight) * zoom;
    const dw = portraitImage.naturalWidth * cover, dh = portraitImage.naturalHeight * cover;
    ctx.drawImage(portraitImage, (w - dw) * px, (h - dh) * py, dw, dh);
    ctx.restore();
  }

  async function renderPoster(scale) {
    if (!ready) throw new Error('The keepsake is still loading.');
    await document.fonts.ready;
    const canvas = makeCanvas(GRAD_WIDTH * scale, GRAD_HEIGHT * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(artworkImage, 0, 0, GRAD_WIDTH, GRAD_HEIGHT);
    drawPortrait(ctx);

    const text = currentText();
    for (const key of Object.keys(gradLabels)) {
      const box = textBoxes[key];
      if (isDefault(key)) {
        ctx.drawImage(defaultTextCrops[key], box.x, box.y, box.w, box.h);
        continue;
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(box.x, box.y, box.w, box.h);
      ctx.clip();
      ctx.font = fontFor(key, text[key]).font;
      ctx.fillStyle = key === 'name' ? '#fffdf4' : '#002d1c';
      ctx.textAlign = key === 'name' ? 'center' : 'left';
      ctx.textBaseline = 'alphabetic';
      if (key === 'name') {
        ctx.shadowColor = '#002918';
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 2;
      }
      const fontMetrics = ctx.measureText('Hg');
      const ascent = fontMetrics.fontBoundingBoxAscent ?? fontMetrics.actualBoundingBoxAscent;
      const descent = fontMetrics.fontBoundingBoxDescent ?? fontMetrics.actualBoundingBoxDescent;
      const baseline = box.y + box.h / 2 + (ascent - descent) / 2;
      ctx.fillText(text[key], key === 'name' ? GRAD_WIDTH / 2 : box.x, baseline);
      ctx.restore();
    }
    return canvas;
  }

  function drawCornerBracket(ctx, x, y, dx, dy, size = 30) {
    ctx.save();
    ctx.strokeStyle = '#bd913e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + dx * size, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * size);
    ctx.stroke();
    ctx.restore();
  }

  function drawGradCap(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#bd913e';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(24, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-24, 0);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-13, 3);
    ctx.lineTo(13, 3);
    ctx.lineTo(11, 10);
    ctx.lineTo(-11, 10);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#e5c365';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(20, 6);
    ctx.lineTo(22, 16);
    ctx.stroke();
    ctx.restore();
  }

  function drawRibbonBanner(ctx, x, y, w, h, text) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 31, 19, 0.4)';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.shadowBlur = 10;

    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#09593a');
    grad.addColorStop(0.5, '#063e28');
    grad.addColorStop(1, '#042719');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = '#ecd382';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + w, y);
    ctx.stroke();

    ctx.strokeStyle = '#946e27';
    ctx.beginPath();
    ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h);
    ctx.stroke();

    const tailW = 28;
    ctx.fillStyle = '#042719';
    ctx.beginPath();
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x - tailW, y + h / 2);
    ctx.lineTo(x, y + h - 4);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + w, y + 4);
    ctx.lineTo(x + w + tailW, y + h / 2);
    ctx.lineTo(x + w + tailW, y + h / 2);
    ctx.lineTo(x + w, y + h - 4);
    ctx.closePath();
    ctx.fill();

    const calFont = calFontForName(text, w - 40);
    ctx.font = calFont.font;
    ctx.fillStyle = '#fffdf4';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#001f13';
    ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 2; ctx.shadowBlur = 3;
    ctx.fillText(text, x + w / 2, y + h / 2);
    ctx.restore();
  }

  function drawMonthsGrid(ctx, year, startX, startY, cardW, cardH, gapX, gapY) {
    const y = year || 2026;

    for (let m = 0; m < 12; m++) {
      const col = m % 3;
      const row = Math.floor(m / 3);
      const cx = startX + col * (cardW + gapX);
      const cy = startY + row * (cardH + gapY);

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx, cy, cardW, cardH);
      ctx.strokeStyle = '#d5decb';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, cy, cardW, cardH);

      ctx.fillStyle = '#063e28';
      ctx.fillRect(cx, cy, cardW, 26);
      ctx.strokeStyle = '#bd913e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 26); ctx.lineTo(cx + cardW, cy + 26);
      ctx.stroke();

      ctx.fillStyle = '#fffdf5';
      ctx.font = 'bold 13px "Times New Roman", Times, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(MONTH_NAMES[m], cx + cardW / 2, cy + 13);

      ctx.fillStyle = '#f3f6ee';
      ctx.fillRect(cx, cy + 27, cardW, 18);
      ctx.strokeStyle = '#e1e7db';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 45); ctx.lineTo(cx + cardW, cy + 45);
      ctx.stroke();

      const colW = cardW / 7;
      ctx.font = 'bold 10px Arial, sans-serif';
      for (let w = 0; w < 7; w++) {
        ctx.fillStyle = w === 0 ? '#b33927' : '#063e28';
        ctx.fillText(WEEKDAY_NAMES[w], cx + w * colW + colW / 2, cy + 36);
      }

      const firstDay = new Date(y, m, 1).getDay();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      ctx.font = '600 11.5px Arial, sans-serif';

      for (let d = 1; d <= daysInMonth; d++) {
        const slot = firstDay + d - 1;
        const sc = slot % 7;
        const sr = Math.floor(slot / 7);
        const dx = cx + sc * colW + colW / 2;
        const dy = cy + 48 + sr * 20 + 10;

        ctx.fillStyle = sc === 0 ? '#b33927' : '#1b3024';
        ctx.fillText(d.toString(), dx, dy);
      }
      ctx.restore();
    }
  }

  async function renderCalendar(scale) {
    if (!ready) throw new Error('The calendar is still loading.');
    await document.fonts.ready;
    const canvas = makeCanvas(CAL_WIDTH * scale, CAL_HEIGHT * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(0, 0, CAL_WIDTH, CAL_HEIGHT);

    ctx.lineWidth = 14;
    ctx.strokeStyle = '#063e28';
    ctx.strokeRect(16, 16, CAL_WIDTH - 32, CAL_HEIGHT - 32);

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#bd913e';
    ctx.strokeRect(28, 28, CAL_WIDTH - 56, CAL_HEIGHT - 56);

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#d4af37';
    ctx.strokeRect(34, 34, CAL_WIDTH - 68, CAL_HEIGHT - 68);

    drawCornerBracket(ctx, 34, 34, 1, 1);
    drawCornerBracket(ctx, CAL_WIDTH - 34, 34, -1, 1);
    drawCornerBracket(ctx, 34, CAL_HEIGHT - 34, 1, -1);
    drawCornerBracket(ctx, CAL_WIDTH - 34, CAL_HEIGHT - 34, -1, -1);

    if (crecheLogoImg) {
      ctx.drawImage(crecheLogoImg, 55, 42, 128, 115);
    }
    if (limpopoLogoImg) {
      ctx.drawImage(limpopoLogoImg, CAL_WIDTH - 245, 52, 195, 75);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    ctx.font = 'bold 30px Georgia, serif';
    ctx.fillStyle = '#063e28';
    ctx.fillText('DREAM BIG CRÈCHE', CAL_WIDTH / 2, 64);

    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillStyle = '#567261';
    ctx.fillText('GROW  •  LEARN  •  BELONG  •  SUCCEED', CAL_WIDTH / 2, 82);

    drawGradCap(ctx, CAL_WIDTH / 2, 98);

    const year = fields.year ? fields.year.value : '2026';
    ctx.font = 'bold 42px "Times New Roman", Times, serif';
    ctx.fillStyle = '#063e28';
    ctx.shadowColor = 'rgba(189, 145, 62, 0.4)';
    ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 2; ctx.shadowBlur = 3;
    ctx.fillText(`${year} CALENDAR`, CAL_WIDTH / 2, 145);
    ctx.shadowColor = 'transparent';

    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    ctx.fillStyle = '#bd913e';
    ctx.fillText('SMALL STEPS  •  BRIGHTER TOMORROWS', CAL_WIDTH / 2, 168);

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#bd913e';
    ctx.beginPath();
    ctx.moveTo(330, 180); ctx.lineTo(CAL_WIDTH - 330, 180);
    ctx.stroke();

    ctx.fillStyle = '#bd913e';
    ctx.font = '11px serif';
    ctx.fillText('✦', CAL_WIDTH / 2, 184);

    if (leftQuoteImg) {
      ctx.drawImage(leftQuoteImg, 65, 235, 220, 280);
    }
    if (rightQuoteImg) {
      ctx.drawImage(rightQuoteImg, CAL_WIDTH - 285, 235, 220, 280);
    }

    drawCalendarPortrait(ctx, calPhotoBox.x, calPhotoBox.y, calPhotoBox.w, calPhotoBox.h);

    const ribW = 660, ribH = 52;
    const ribX = (CAL_WIDTH - ribW) / 2, ribY = 642;
    drawRibbonBanner(ctx, ribX, ribY, ribW, ribH, fields.name.value.trim() || 'Bonolo Makola');

    ctx.font = 'bold 18px "Times New Roman", Times, serif';
    ctx.fillStyle = '#002d1c';
    ctx.textAlign = 'center';
    const dobText = `📅  DOB: ${displayDob(fields.dob.value)}`;
    const genText = `👤  Gender: ${fields.gender.value.trim() || 'Male'}`;
    ctx.fillText(`${dobText}     |     ${genText}`, CAL_WIDTH / 2, 720);

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#bd913e';
    ctx.beginPath();
    ctx.moveTo(80, 746); ctx.lineTo(CAL_WIDTH - 80, 746);
    ctx.stroke();

    ctx.fillStyle = '#063e28';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText(`✦   ${year} ACADEMIC YEAR   ✦`, CAL_WIDTH / 2, 750);

    drawMonthsGrid(ctx, parseInt(year, 10), 65, 772, 340, 182, 25, 15);

    ctx.textAlign = 'center';
    ctx.font = 'italic 20px Georgia, serif';
    ctx.fillStyle = '#063e28';
    ctx.fillText('Congratulations on Your Achievement', CAL_WIDTH / 2, 1618);

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#bd913e';
    ctx.beginPath();
    ctx.moveTo(350, 1632); ctx.lineTo(CAL_WIDTH - 350, 1632);
    ctx.stroke();

    ctx.font = 'bold 14px "Times New Roman", Times, serif';
    ctx.fillStyle = '#bd913e';
    ctx.fillText('E D U C A T I O N   I S   P R I C E L E S S', CAL_WIDTH / 2, 1650);

    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.fillStyle = '#6b786e';
    ctx.fillText('REPUBLIC OF SOUTH AFRICA', CAL_WIDTH / 2, 1666);

    return canvas;
  }

  function pngBlob(canvas) {
    return new Promise((resolve, reject) =>
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed. Please try again.')), 'image/png')
    );
  }

  function filename() {
    const name = fields.name.value.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'Student';
    if (currentMode === 'calendar') {
      const year = fields.year ? fields.year.value : '2026';
      return `${name}-Dream-Big-Calendar-${year}.png`;
    }
    return `${name}-Dream-Big-Graduation.png`;
  }

  // Tab Listeners
  for (const mode of Object.keys(tabs)) {
    if (tabs[mode]) tabs[mode].addEventListener('click', () => setMode(mode));
  }

  $('download').addEventListener('click', async () => {
    if (currentMode === 'book') {
      window.print();
      return;
    }
    if (!form.reportValidity()) return;
    $('download').disabled = true;
    status('Preparing high-resolution PNG…');
    try {
      const canvas = currentMode === 'calendar' ? await renderCalendar(EXPORT_SCALE) : await renderPoster(EXPORT_SCALE);
      const blob = await pngBlob(canvas);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename();
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      status(`Your ${currentMode === 'calendar' ? '3600 × 5100' : '3594 × 3939'} PNG is ready.`);
    } catch (error) {
      status(error.message, true);
    } finally {
      $('download').disabled = false;
    }
  });

  $('preview').addEventListener('click', async () => {
    if (currentMode === 'book') {
      showSpread(1);
      return;
    }
    if (!form.reportValidity()) return;
    try {
      const canvas = currentMode === 'calendar' ? await renderCalendar(1) : await renderPoster(1);
      $('full-preview').src = canvas.toDataURL('image/png');
      $('dialog-title').textContent = currentMode === 'calendar' ? 'Your student calendar preview' : 'Your graduation keepsake';
      $('preview-dialog').showModal();
    } catch (error) {
      status(error.message, true);
    }
  });

  $('close-preview').addEventListener('click', () => $('preview-dialog').close());
  $('preview-dialog').addEventListener('click', event => {
    if (event.target === $('preview-dialog')) $('preview-dialog').close();
  });

  for (const field of Object.values(fields)) {
    if (field) field.addEventListener('input', updateText);
  }
  if (fields.year) {
    fields.year.addEventListener('change', () => {
      updateCalendarGrid(fields.year.value);
    });
  }

  for (const input of Object.values(photoControls)) {
    input.addEventListener('input', updatePhoto);
  }

  form.addEventListener('submit', event => event.preventDefault());

  form.addEventListener('reset', () => {
    uploadRevision++;
    requestAnimationFrame(() => {
      for (const key of Object.keys(defaults)) {
        if (fields[key]) fields[key].value = defaults[key];
      }
      if (originalPortrait) {
        portraitImage = originalPortrait;
        $('student-portrait').src = originalPortrait.src;
        $('cal-student-portrait').src = originalPortrait.src;
        if ($('book-portrait-img')) $('book-portrait-img').src = originalPortrait.src;
      }
      resetPhotoPosition();
      updateText();
      updateCalendarGrid(defaults.year);
      showSpread(0);
      status('Original student details and portrait restored.');
    });
  });

  $('student-photo').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      event.target.value = '';
      status('Please choose a JPG, PNG or WebP photo.', true);
      return;
    }
    const revision = ++uploadRevision;
    const url = URL.createObjectURL(file);
    try {
      status('Opening your portrait…');
      const image = await loadImage(url);
      const canvas = makeCanvas(image.naturalWidth, image.naturalHeight);
      canvas.getContext('2d').drawImage(image, 0, 0);
      const loaded = await loadImage(canvas.toDataURL('image/png'));
      if (revision !== uploadRevision) return;
      portraitImage = loaded;
      $('student-portrait').src = loaded.src;
      $('cal-student-portrait').src = loaded.src;
      if ($('book-portrait-img')) $('book-portrait-img').src = loaded.src;
      resetPhotoPosition();
      status('Portrait updated. Adjust its position if needed.');
    } catch (error) {
      if (revision === uploadRevision) status(error.message, true);
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  // Drag portrait handlers
  function attachDrag(windowElement, getBox) {
    if (!windowElement) return;
    windowElement.addEventListener('pointerdown', event => {
      if (!ready) return;
      dragStart = {
        clientX: event.clientX,
        clientY: event.clientY,
        x: Number(photoControls.x.value),
        y: Number(photoControls.y.value)
      };
      windowElement.setPointerCapture(event.pointerId);
      windowElement.classList.add('dragging');
    });

    windowElement.addEventListener('pointermove', event => {
      if (!dragStart) return;
      const box = getBox();
      const bounds = windowElement.getBoundingClientRect();
      const cover = Math.max(box.w / portraitImage.naturalWidth, box.h / portraitImage.naturalHeight) * Number(photoControls.zoom.value) / 100;
      const extraX = (portraitImage.naturalWidth * cover - box.w) * bounds.width / box.w;
      const extraY = (portraitImage.naturalHeight * cover - box.h) * bounds.height / box.h;
      const clamp = value => Math.max(0, Math.min(100, value));
      if (extraX > 1) photoControls.x.value = clamp(dragStart.x - (event.clientX - dragStart.clientX) / extraX * 100);
      if (extraY > 1) photoControls.y.value = clamp(dragStart.y - (event.clientY - dragStart.clientY) / extraY * 100);
      updatePhoto();
    });

    function endDrag() {
      dragStart = null;
      windowElement.classList.remove('dragging');
    }
    windowElement.addEventListener('pointerup', endDrag);
    windowElement.addEventListener('pointercancel', endDrag);
  }

  attachDrag($('portrait-window'), () => photoBox);
  attachDrag($('cal-portrait-window'), () => calPhotoBox);

  new ResizeObserver(fitStage).observe(stage);
  window.addEventListener('resize', fitStage);

  // Memoriq AI Integration ("Plus You")
  function setupAIStudio() {
    const btnGen = $('btn-generate-ai');
    const outContainer = $('ai-output-container');
    const outText = $('ai-output-text');
    const typeSelect = $('ai-gen-type');
    const langSelect = $('ai-gen-lang');
    const promptInput = $('ai-custom-prompt');
    const btnApply = $('btn-apply-to-book');
    const btnCopy = $('btn-copy-ai');

    const toggleKey = $('toggle-gemini-settings');
    const keyBox = $('gemini-key-box');
    const keyInput = $('gemini-api-key');
    const btnSaveKey = $('save-gemini-key');

    if (window.memoriqAI && keyInput) {
      keyInput.value = window.memoriqAI.getApiKey();
    }

    if (toggleKey) {
      toggleKey.addEventListener('click', () => {
        keyBox.style.display = keyBox.style.display === 'none' ? 'block' : 'none';
      });
    }

    if (btnSaveKey) {
      btnSaveKey.addEventListener('click', () => {
        window.memoriqAI.setApiKey(keyInput.value);
        status(keyInput.value ? 'Gemini API key saved in browser.' : 'Gemini key cleared.');
        keyBox.style.display = 'none';
      });
    }

    // Quick Prompt Chips
    document.querySelectorAll('.ai-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeSelect) typeSelect.value = btn.dataset.type || 'graduation_wish';
        if (langSelect) langSelect.value = btn.dataset.lang || 'en';
        if (btnGen) btnGen.click();
      });
    });

    if (btnGen) {
      btnGen.addEventListener('click', async () => {
        btnGen.disabled = true;
        btnGen.textContent = '✨ Thinking & Generating…';
        try {
          const type = typeSelect ? typeSelect.value : 'graduation_wish';
          const lang = langSelect ? langSelect.value : 'en';
          const customPrompt = promptInput ? promptInput.value.trim() : '';

          const generated = await window.memoriqAI.generate(type, {
            name: fields.name.value.trim() || 'Bonolo Makola',
            gender: fields.gender.value.trim() || 'Male',
            dob: fields.dob.value || '2021-08-18',
            dream: fields.dream.value.trim() || 'Doctor',
            teacher: fields.teacher.value.trim() || 'Teacher Thandi',
            lang,
            customPrompt
          });

          outText.textContent = generated;
          outContainer.style.display = 'block';
          status('Generated text ready!');
        } catch (err) {
          status(`AI Error: ${err.message}`, true);
        } finally {
          btnGen.disabled = false;
          btnGen.textContent = '✨ Generate with Memoriq AI';
        }
      });
    }

    if (btnApply) {
      btnApply.addEventListener('click', () => {
        const text = outText.textContent.trim();
        if (text && fields.blessing) {
          fields.blessing.value = text;
          updateText();
          setMode('book');
          showSpread(2); // Jump to memories spread
          status('Applied to Memory Book!');
        }
      });
    }

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const text = outText.textContent.trim();
        if (text) {
          await navigator.clipboard.writeText(text);
          btnCopy.textContent = '✓ Copied!';
          setTimeout(() => { btnCopy.textContent = '📋 Copy Text'; }, 2000);
        }
      });
    }
  }

  // Mount Scannable QR Code Plaque
  function setupQRCode() {
    const container = $('plaque-qr-container');
    if (!container || !window.createMemoriqQRCode) return;
    container.innerHTML = '';
    const targetUrl = 'https://students-lemon-seven.vercel.app/';
    const svg = window.createMemoriqQRCode(targetUrl, 160);
    container.appendChild(svg);
  }

  async function initialise() {
    try {
      const refSrc = window.REFERENCE_IMAGE || 'assets/reference.png';
      sourceImage = await loadImage(refSrc);

      if (sourceImage.naturalWidth !== GRAD_WIDTH || sourceImage.naturalHeight !== GRAD_HEIGHT) {
        throw new Error('Reference artwork dimensions do not match the template.');
      }

      artworkImage = await loadImage(prepareArtwork());
      for (const key of Object.keys(textBoxes)) {
        defaultTextCrops[key] = await loadImage(cropReference(textBoxes[key]));
      }

      if (window.CRECHE_LOGO_DATA) {
        crecheLogoImg = await loadImage(window.CRECHE_LOGO_DATA);
      } else {
        crecheLogoImg = await loadImage('assets/logo-reference.png').catch(() => null);
      }

      if (window.LIMPOPO_LOGO_DATA) {
        limpopoLogoImg = await loadImage(window.LIMPOPO_LOGO_DATA);
      } else {
        limpopoLogoImg = await loadImage('assets/limpopo-logo.png').catch(() => null);
      }

      leftQuoteImg = await loadImage(cropReference({ x: 60, y: 475, w: 220, h: 290 })).catch(() => null);
      rightQuoteImg = await loadImage(cropReference({ x: 920, y: 475, w: 220, h: 290 })).catch(() => null);

      originalPortrait = await loadImage(cropReference(photoBox));
      portraitImage = originalPortrait;

      $('fixed-artwork').src = artworkImage.src;
      $('student-portrait').src = portraitImage.src;
      $('cal-student-portrait').src = portraitImage.src;
      if ($('book-portrait-img')) $('book-portrait-img').src = portraitImage.src;

      updateCalendarGrid(defaults.year);
      showSpread(0);
      setupQRCode();
      setupAIStudio();

      ready = true;
      updateText();
      updatePhoto();

      $('download').disabled = false;
      $('preview').disabled = false;
      gradCard.dataset.ready = 'true';
      calCard.dataset.ready = 'true';

      if (window.location.hash === '#calendar' || window.location.pathname.endsWith('calendar.html')) {
        setMode('calendar');
      } else if (window.location.hash === '#book' || window.location.pathname.endsWith('memory-book.html')) {
        setMode('book');
      } else if (window.location.hash === '#ai') {
        setMode('ai');
      } else {
        setMode('graduation');
      }

      status('Ready. Your changes appear instantly across all formats.');
    } catch (error) {
      status(error.message, true);
    }
  }

  initialise();
})();
