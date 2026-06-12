import {
  Engine,
  SimulationType,
  CameraFocusPoint,
} from './js/3ngine.module.js';

const PHOTO_STEPS = [
  {
    id: 'front',
    title: 'Front photo',
    label: 'First, take your front photo',
    hint: "Look straight ahead and align your face with the outline. When you're ready, tap the capture button.",
    button: 'Capture front photo',
    source: '/3d/face_adult_woman/media/face_reconstruction/front.jpg?v=white-bg-20260610',
    alt: 'Front example photo for 3D preview'
  },
  {
    id: 'right_45',
    title: 'Right photo',
    label: 'Now turn slightly to the right',
    hint: 'Align your face with the outline and take your second photo.',
    button: 'Capture right photo',
    source: '/3d/face_adult_woman/media/face_reconstruction/right_45.jpg?v=white-bg-20260610',
    alt: 'Right side example photo for 3D preview'
  },
  {
    id: 'left_45',
    title: 'Left photo',
    label: 'Finally, turn slightly to the left',
    hint: 'Align your face with the outline and take your third photo.',
    button: 'Capture left photo',
    source: '/3d/face_adult_woman/media/face_reconstruction/left_45.jpg?v=white-bg-20260610',
    alt: 'Left side example photo for 3D preview'
  }
];

const AREAS = [
  { id: 'frontal', name: 'Forehead', subtitle: 'Forehead' },
  { id: 'orbital', name: 'Eyes', subtitle: 'Eye area' },
  { id: 'nasal', name: 'Nose', subtitle: 'Nose' },
  { id: 'zygomatic', name: 'Cheeks', subtitle: 'Cheeks' },
  { id: 'buccal', name: 'Nasolabial', subtitle: 'Nasolabial folds' },
  { id: 'oral', name: 'Mouth', subtitle: 'Mouth / lips' },
  { id: 'mental', name: 'Chin', subtitle: 'Chin' },
  { id: 'auricular', name: 'Jaw', subtitle: 'Jaw / neck' }
];

const REGION_IMPROVEMENT_CHIPS = {
  frontal: ['Horizontal forehead lines', 'Frown lines', 'Heavy brow', 'Shiny or uneven texture'],
  orbital: ['Dark circles', "Crow's feet", 'Eyelid heaviness', 'Under-eye bags'],
  nasal: ['Bridge shape', 'Visible hump', 'Tip position', 'Nostril width'],
  zygomatic: ['Flat cheekbones', 'Mid-face volume loss', 'Cheek sagging'],
  buccal: ['Hollow cheeks', 'Full cheeks', 'Uneven skin tone', 'Pigmentation'],
  oral: ['Lip volume loss', 'Lip border definition', 'Lines around the mouth', 'Mouth corners turning down'],
  mental: ['Small or recessed chin', 'Chin dimpling', 'Profile balance'],
  auricular: ['Soft jawline', 'Jowls', 'Double chin', 'Neck bands'],
};

const GENERIC_IMPROVEMENT_CHIPS = ['Lines or wrinkles', 'Volume loss', 'Asymmetry', 'Sagging or heaviness', 'Texture or pigmentation'];

const REGION_CAMERA_MAP = {
  frontal:   { point: 'BROWS_CENTER', az:  0, pol: 0, zoom: 0.40 },
  orbital:   { point: 'EYES_MIDDLE',  az:  0, pol: 0, zoom: 0.40 },
  nasal:     { point: 'NOSE_MIDDLE',  az:  0, pol: 0, zoom: 0.62 },
  zygomatic: { point: 'EYES_MIDDLE',  az:  0, pol: 0, zoom: 0.34 },
  buccal:    { point: 'LIPS_CENTER',  az:  0, pol: 0, zoom: 0.30 },
  oral:      { point: 'LIPS_CENTER',  az:  0, pol: 0, zoom: 0.74 },
  mental:    { point: 'CHIN_MIDDLE',  az:  0, pol: 0, zoom: 0.56 },
  auricular: { point: 'JAW_MIDDLE',   az: 30, pol: 0, zoom: 0.10 },
};

const HOTSPOT_POSITIONS = {
  frontal:   { left: '50%', top: '30%' },
  orbital:   { left: '27%', top: '44%' },
  nasal:     { left: '50%', top: '43%' },
  zygomatic: { left: '73%', top: '52%' },
  buccal:    { left: '73%', top: '63%' },
  oral:      { left: '50%', top: '69%' },
  mental:    { left: '50%', top: '81%' },
  auricular: { left: '73%', top: '81%' },
};

const ENGINE_PATIENT = {
  id: 1,
  type: SimulationType.FACE,
  beforeMeshUrl: '/3d/face_adult_woman/rec/face/face.k3d',
  beforeTextureUrl: '/3d/face_adult_woman/rec/face/face.jpg',
  alphaMapUrl: '/3d/face_adult_woman/common/face_alpha_map.jpg',
  beforeFullScanMeshUrl: '/3d/face_adult_woman/tmp/face/full_scan/full_scan.k3d',
  beforeFullScanTextureUrl: '/3d/face_adult_woman/tmp/face/full_scan/scan.jpg',
  morphTargetsUrl: '/3d/face_adult_woman/common/deformations.dfrm',
};

const state = {
  currentPhoto: 0,
  photos: [],
  rankingStarted: false,
  priorities: [],
  ratingIndex: 0,
  ratingStage: 'intro',
  ratings: Object.fromEntries(AREAS.map((area) => [area.id, null])),
  comments: Object.fromEntries(AREAS.map((area) => [area.id, ''])),
  rankingEngine: null,
  ratingEngine: null,
  rankingReady: false,
  ratingReady: false,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function setStep(step) {
  $$('[data-real-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.realPanel === step));
  $$('[data-real-step-dot]').forEach((dot) => dot.classList.toggle('active', dot.dataset.realStepDot === step));
  document.body.classList.toggle('faces3d-widget-working', step === 'photos' || step === 'ranking' || step === 'rating');

  const title = $('#face3dTitle');
  const subtitle = $('.widget-header-row p');
  if (title && subtitle) {
    if (step === 'ranking') {
      title.textContent = 'Tell us what you love most — and what matters most to you';
      subtitle.textContent = 'Rank the 8 facial areas from your favorite to your least favorite. Start with the area you feel happiest about and continue one area at a time. You can always go back and adjust your selections before continuing.';
    } else {
      title.textContent = 'Create your 3D preview';
      subtitle.textContent = 'Start with 3 quick photos so your clinic can better understand your facial features and personalize your consultation.';
    }
  }

  const widget = $('#face3dWidget');
  if (widget) {
    widget.dataset.currentStep = step;
    widget.classList.toggle('ranking-started', step === 'ranking' && state.rankingStarted);
  }
}

function updatePayload() {
  const payload = {
    source: 'prototype-face-non-invasive-real-crisalix-widget',
    photo_sources: PHOTO_STEPS.map((photo) => ({
      id: photo.id,
      label: photo.label,
      captured: state.photos.includes(photo.id),
      url: photo.source,
    })),
    model_3d_url: '/3d/face_adult_woman/full_scan.k3d',
    engine_assets: {
      beforeMeshUrl: ENGINE_PATIENT.beforeMeshUrl,
      beforeTextureUrl: ENGINE_PATIENT.beforeTextureUrl,
      alphaMapUrl: ENGINE_PATIENT.alphaMapUrl,
      beforeFullScanMeshUrl: ENGINE_PATIENT.beforeFullScanMeshUrl,
      beforeFullScanTextureUrl: ENGINE_PATIENT.beforeFullScanTextureUrl,
      morphTargetsUrl: ENGINE_PATIENT.morphTargetsUrl,
    },
    priorities: state.priorities.map((id, index) => {
      const area = AREAS.find((item) => item.id === id);
      return { rank: index + 1, id, name: area?.name, subtitle: area?.subtitle };
    }),
    ratings: state.priorities.map((id) => {
      const area = AREAS.find((item) => item.id === id);
      return {
        id,
        name: area?.name,
        subtitle: area?.subtitle,
        score: null,
        concerns: state.comments[id] || '',
        comment: state.comments[id] || '',
      };
    }),
  };
  $('#face3dPayload').value = JSON.stringify(payload);
  return payload;
}

function renderPhotos() {
  const step = PHOTO_STEPS[state.currentPhoto] || PHOTO_STEPS[PHOTO_STEPS.length - 1];
  const complete = state.photos.length >= PHOTO_STEPS.length;
  const photoTitle = $('[data-photo-title]');
  const photoHeading = photoTitle?.closest('.real-step-heading');
  if (photoHeading) photoHeading.hidden = complete;
  if (photoTitle) photoTitle.textContent = step.title;
  $('[data-photo-label]').textContent = step.label;
  $('[data-photo-hint]').textContent = step.hint;
  const ghost = $('[data-photo-ghost]');
  ghost.src = step.source;
  ghost.alt = step.alt;
  const captureButton = $('[data-photo-capture]');
  if (!captureButton.dataset.cameraIcon) captureButton.dataset.cameraIcon = captureButton.innerHTML;
  captureButton.hidden = false;
  captureButton.setAttribute('aria-label', complete ? 'Continue' : step.button);
  captureButton.classList.toggle('photo-continue-in-card', complete);
  captureButton.innerHTML = complete ? 'Continue' : captureButton.dataset.cameraIcon;
  const photoCard = $('[data-photo-card]');
  if (photoCard) photoCard.classList.toggle('complete', complete);
  const completeCard = $('[data-photo-complete]');
  if (completeCard) completeCard.hidden = !complete;
  const continueButton = $('[data-photo-continue]');
  if (continueButton) continueButton.hidden = true;
  $('[data-photo-strip]').innerHTML = PHOTO_STEPS.map((photo, index) => `
    <div class="real-photo-thumb ${state.photos.includes(photo.id) ? 'captured' : ''}">
      <img src="${photo.source}" alt="${photo.alt}">
      <span>${index + 1}</span>
    </div>`).join('');
  updatePayload();
}

function continueToRanking() {
  if (state.photos.length < PHOTO_STEPS.length) return;
  updatePayload();
  setStep('ranking');
  void initRankingEngine();
}

function capturePhoto() {
  if (state.photos.length >= PHOTO_STEPS.length) {
    continueToRanking();
    return;
  }
  const step = PHOTO_STEPS[state.currentPhoto];
  if (step && !state.photos.includes(step.id)) state.photos.push(step.id);
  if (state.photos.length >= PHOTO_STEPS.length) {
    state.currentPhoto = PHOTO_STEPS.length - 1;
    continueToRanking();
    return;
  }
  state.currentPhoto += 1;
  renderPhotos();
}

async function createEngine(canvas, { locked = false, autoRotate = false } = {}) {
  const engine = new Engine();
  await engine.start({
    canvas: { before: canvas, dragZone: canvas },
    patient: ENGINE_PATIENT,
  });
  try { engine.toggleCameraZoom(true); } catch (_) {}
  if (locked) {
    try { engine.disableAutoRotation(); } catch (_) {}
    try { engine.toggleCameraPanning(false); } catch (_) {}
    try { await engine.setCameraView(0, 0, false); } catch (_) {}
    try { await engine.fitCameraToModel(0.9, 0.95, false); } catch (_) {}
  } else if (autoRotate) {
    try { engine.toggleCameraPanning(false); } catch (_) {}
    try { engine.enableAutoRotation(8, -30, 30, 0, 0); } catch (_) {}
    canvas.addEventListener('pointerdown', () => { try { engine.disableAutoRotation(); } catch (_) {} });
    canvas.addEventListener('pointerup', () => { setTimeout(() => { try { engine.enableAutoRotation(8, -30, 30, 0, 0); } catch (_) {} }, 3000); });
  }
  return engine;
}

async function initRankingEngine() {
  if (state.rankingEngine) return;
  try {
    state.rankingEngine = await createEngine($('[data-real-ranking-canvas]'), { autoRotate: true });
    state.rankingReady = true;
    $('[data-ranking-loading]').classList.add('hidden');
  } catch (err) {
    console.error('[faces3d-widget] ranking 3D init failed', err);
    $('[data-ranking-loading]').textContent = '3D failed to load';
  }
}

async function initRatingEngine() {
  if (state.ratingEngine) return;
  try {
    state.ratingEngine = await createEngine($('[data-real-rating-canvas]'), { autoRotate: true });
    state.ratingReady = true;
    $('[data-rating-loading]').classList.add('hidden');
    focusRatingArea();
  } catch (err) {
    console.error('[faces3d-widget] rating 3D init failed', err);
    $('[data-rating-loading]').textContent = '3D failed to load';
  }
}

function setRankingHint() {
  $('[data-ranking-hint]').innerHTML = '<span>Then continue ranking the remaining areas one by one until all 8 areas are ordered.</span><strong>1 = Favorite area</strong><strong>8 = Least favorite area</strong>';
}

async function stopRankingAutoRotationForSelection() {
  if (!state.rankingEngine) return;
  try { state.rankingEngine.disableAutoRotation(); } catch (_) {}
  try { state.rankingEngine.toggleCameraPanning(false); } catch (_) {}
  try { state.rankingEngine.toggleCameraZoom(false); } catch (_) {}
  try { await state.rankingEngine.setCameraView(0, 0, false); } catch (_) {}
  try { await state.rankingEngine.fitCameraToModel(0.9, 0.95, false); } catch (_) {}
}

async function startRanking() {
  state.rankingStarted = true;
  await stopRankingAutoRotationForSelection();
  $('#face3dWidget')?.classList.add('ranking-started');
  $('[data-ranking-intro]').classList.add('hidden');
  $('[data-real-hotspots]').classList.remove('hidden');
  $('[data-ranking-prompt]').textContent = 'Select the area you feel happiest about first.';
  setRankingHint();
  renderRanking();
}

function renderRanking() {
  const hotspots = $('[data-real-hotspots]');
  hotspots.innerHTML = AREAS.map((area) => {
    const rank = state.priorities.indexOf(area.id) + 1;
    const pos = HOTSPOT_POSITIONS[area.id];
    return `<button type="button" class="real-hotspot ${rank ? 'selected' : ''}" data-area="${area.id}" data-rank="${rank || ''}" style="left:${pos.left};top:${pos.top}">${area.name}</button>`;
  }).join('');

  $('[data-selected-priorities]').innerHTML = state.priorities.length
    ? state.priorities.map((id, index) => {
      const area = AREAS.find((item) => item.id === id);
      return `<li draggable="true" data-priority-id="${id}"><span>${index + 1}</span><strong>${area.name}</strong><button type="button" data-remove-area="${id}" aria-label="Remove ${area.name}">×</button></li>`;
    }).join('')
    : '<li class="empty">No picks yet.</li>';

  const selectedHelp = $('[data-selected-help]');
  if (selectedHelp) selectedHelp.hidden = state.priorities.length < 2;
  const rankingContinue = $('[data-ranking-continue]');
  const rankingComplete = state.priorities.length >= AREAS.length;
  rankingContinue.disabled = !rankingComplete;
  rankingContinue.hidden = !rankingComplete;
  if (state.priorities.length >= AREAS.length) {
    $('[data-ranking-prompt]').textContent = 'Perfect — your 8 areas are ordered.';
    $('[data-ranking-hint]').innerHTML = 'You have ordered your facial areas from your favorite to your least favorite.<br>Next, we\'ll review each area one at a time so you can tell us more about what matters to you.<br>You will be able to go back and edit your ranking and answers at any time.';
  } else if (state.rankingStarted) {
    const next = state.priorities.length + 1;
    $('[data-ranking-prompt]').textContent = next === 1
      ? 'Select the area you feel happiest about first.'
      : `Now select area ${next} of ${AREAS.length}.`;
    setRankingHint();
  }
  updatePayload();
}

function toggleArea(areaId) {
  if (!state.rankingStarted) return;
  if (state.priorities.includes(areaId)) {
    state.priorities = state.priorities.filter((id) => id !== areaId);
  } else if (state.priorities.length < AREAS.length) {
    state.priorities.push(areaId);
  }
  renderRanking();
}

function reorderPriority(sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId) return;
  const fromIndex = state.priorities.indexOf(sourceId);
  const toIndex = state.priorities.indexOf(targetId);
  if (fromIndex < 0 || toIndex < 0) return;
  const next = [...state.priorities];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  state.priorities = next;
  renderRanking();
}

function goToRatings() {
  setStep('rating');
  state.ratingIndex = 0;
  state.ratingStage = 'intro';
  renderRatingCard();
}

function currentRatingArea() {
  const ordered = state.priorities.length === AREAS.length ? state.priorities : AREAS.map((a) => a.id);
  return AREAS.find((area) => area.id === ordered[state.ratingIndex]) || AREAS[0];
}

function focusRatingArea() {
  const area = currentRatingArea();
  if (!state.ratingReady || !state.ratingEngine || !area) return;
  const cfg = REGION_CAMERA_MAP[area.id];
  if (!cfg) return;
  try { state.ratingEngine.disableAutoRotation(); } catch (_) {}
  try {
    const point = CameraFocusPoint?.[cfg.point];
    const done = () => {
      try { state.ratingEngine.setCameraZoom(cfg.zoom, true); } catch (_) {}
      try { state.ratingEngine.enableAutoRotation(8, -30, 30, 0, 0); } catch (_) {}
    };
    const result = point ? state.ratingEngine.focusCamera(point, cfg.az, cfg.pol) : null;
    if (result && typeof result.then === 'function') result.then(done).catch(done);
    else done();
  } catch (err) {
    console.warn('[faces3d-widget] focus failed', area.id, err);
  }
}

function chipsFor(areaId) {
  return [...new Set([...(REGION_IMPROVEMENT_CHIPS[areaId] || []), ...GENERIC_IMPROVEMENT_CHIPS, 'Other'])];
}

function getOrderedAreas() {
  const ordered = state.priorities.length === AREAS.length ? state.priorities : AREAS.map((a) => a.id);
  return ordered.map((id) => AREAS.find((area) => area.id === id)).filter(Boolean);
}

function nextAreaLabel() {
  const ordered = getOrderedAreas();
  const next = ordered[state.ratingIndex + 1];
  return next ? `Next: ${next.name} (${state.ratingIndex + 2}/${AREAS.length})` : 'Complete assessment';
}

function previousAreaLabel() {
  const ordered = getOrderedAreas();
  const previous = ordered[state.ratingIndex - 1];
  return previous ? `Back: ${previous.name} (${state.ratingIndex}/${AREAS.length})` : 'Back to area ranking';
}

function setRatingViewerVisible(visible) {
  const shell = $('[data-real-rating-canvas]')?.closest('.real-viewer-shell');
  if (shell) shell.hidden = !visible;
}

function renderRatingIntro() {
  $('[data-rating-title]').textContent = "Let's review each area together";
  const subtitle = $('[data-rating-subtitle]');
  if (subtitle) {
    subtitle.hidden = false;
    subtitle.textContent = "We'll go through your areas one at a time";
  }
  setRatingViewerVisible(false);
  $('[data-rating-card]').innerHTML = `
    <section class="assessment-explainer-card">
      <p class="assessment-explainer-lead">For each area:</p>
      <ul>
        <li>Select all the concern(s) that apply to you.</li>
        <li>Choose as many options as you like.</li>
        <li>If none of the options fit, select Other and write what it is.</li>
        <li>When you're finished, tap Next area to continue.</li>
        <li>You can always go back and edit your answers later.</li>
      </ul>
      <div class="guided-question-actions assessment-explainer-actions">
        <button type="button" class="guided-secondary-button" data-rating-ranking-back>Back to area ranking</button>
        <button type="button" class="guided-next-button" data-rating-next>Next</button>
      </div>
    </section>`;
  updatePayload();
}

function renderCompletionCard() {
  $('[data-rating-title]').textContent = "Perfect — you've completed your facial assessment";
  const subtitle = $('[data-rating-subtitle]');
  if (subtitle) subtitle.hidden = true;
  setRatingViewerVisible(false);
  $('[data-rating-card]').innerHTML = `
    <section class="assessment-complete-card">
      <p>Thank you for sharing your priorities and concerns.</p>
      <p>Your responses, together with your 3D preview, will help your clinic better understand your expectations and personalize your consultation and treatment recommendations.</p>
    </section>`;
  document.body.classList.remove('faces3d-widget-working');
  const summary = $('[data-real-summary]');
  if (summary) summary.hidden = true;
  updatePayload();
}

function renderRatingCard() {
  if (state.ratingStage === 'intro') {
    renderRatingIntro();
    return;
  }
  if (state.ratingStage === 'complete') {
    renderCompletionCard();
    return;
  }

  const area = currentRatingArea();
  const comment = state.comments[area.id] || '';
  const selectedChips = comment.split(',').map((part) => part.trim()).filter(Boolean);
  const otherSelected = selectedChips.some((item) => item.toLowerCase() === 'other' || item.toLowerCase().startsWith('other:'));
  const otherText = (comment.match(/(?:^|,\s*)Other:\s*([^,]*)/i)?.[1] || '').trim();
  const hasRequiredAnswer = selectedChips.length > 0;
  const regionLabel = (area.subtitle || area.name || 'area').toLowerCase();
  const progress = `${state.ratingIndex + 1}/${AREAS.length}`;
  const subtitle = $('[data-rating-subtitle]');
  if (subtitle) subtitle.hidden = true;
  $('[data-rating-title]').textContent = `${progress} Tell us more about your ${regionLabel}`;
  setRatingViewerVisible(true);

  $('[data-rating-card]').innerHTML = `
    <section class="real-area-question guided-question-stage">
      <div class="real-guided-question-row">
        <div class="real-question-label">
          <label>Which of the following concerns matter most to you? (select all that apply)</label>
          <span>Required</span>
        </div>
      </div>
      <div class="real-chip-list">
        ${chipsFor(area.id).map((chip) => {
          const active = selectedChips.some((item) => item.toLowerCase() === chip.toLowerCase() || item.toLowerCase().startsWith(`${chip.toLowerCase()}:`));
          return `<button type="button" class="real-chip ${active ? 'active' : ''}" data-bother-chip="${escapeHtml(chip)}">${active ? '✓' : '+'} ${escapeHtml(chip)}</button>`;
        }).join('')}
      </div>
      <input class="real-other-input ${otherSelected ? '' : 'hidden'}"
             data-other-input="${area.id}"
             value="${escapeHtml(otherText)}"
             placeholder="Tell us what else matters to you about your ${escapeHtml(regionLabel)}." />
      <div class="guided-question-actions">
        <button type="button" class="guided-secondary-button" ${state.ratingIndex === 0 ? 'data-rating-ranking-back' : 'data-rating-back'}>${escapeHtml(state.ratingIndex === 0 ? 'Back to area ranking' : previousAreaLabel())}</button>
        <button type="button" class="guided-next-button" data-rating-next ${hasRequiredAnswer ? '' : 'disabled'}>${escapeHtml(nextAreaLabel())}</button>
      </div>
    </section>`;
  focusRatingArea();
  updatePayload();
}
function ratingNext() {
  if (state.ratingStage === 'intro') {
    state.ratingStage = 'question';
    renderRatingCard();
    void initRatingEngine();
    return;
  }
  if (state.ratingStage === 'complete') return;

  const area = currentRatingArea();
  if (!String(state.comments[area.id] || '').trim()) return;

  if (state.ratingIndex < AREAS.length - 1) {
    state.ratingIndex += 1;
    state.ratingStage = 'question';
    renderRatingCard();
    return;
  }

  state.ratingStage = 'complete';
  renderRatingCard();
}
function ratingBack() {
  if (state.ratingStage === 'intro') {
    void backToAreaRanking();
    return;
  }
  if (state.ratingStage === 'complete') {
    state.ratingStage = 'question';
    state.ratingIndex = AREAS.length - 1;
    renderRatingCard();
    return;
  }
  if (state.ratingIndex > 0) {
    state.ratingIndex -= 1;
    state.ratingStage = 'question';
    renderRatingCard();
  } else {
    void backToAreaRanking();
  }
}
async function backToAreaRanking() {
  state.rankingStarted = true;
  setStep('ranking');
  await stopRankingAutoRotationForSelection();
  $('#face3dWidget')?.classList.add('ranking-started');
  $('[data-ranking-intro]').classList.add('hidden');
  $('[data-real-hotspots]').classList.remove('hidden');
  renderRanking();
  void initRankingEngine();
}

$('[data-photo-capture]').addEventListener('click', capturePhoto);
const photoContinue = $('[data-photo-continue]');
if (photoContinue) photoContinue.addEventListener('click', continueToRanking);
$('[data-ranking-start]').addEventListener('click', startRanking);
$('[data-real-hotspots]').addEventListener('click', (event) => {
  const button = event.target.closest('[data-area]');
  if (button) toggleArea(button.dataset.area);
});
const selectedPriorities = $('[data-selected-priorities]');
selectedPriorities.addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-area]');
  if (button) toggleArea(button.dataset.removeArea);
});
selectedPriorities.addEventListener('dragstart', (event) => {
  const item = event.target.closest('[data-priority-id]');
  if (!item) return;
  state.draggedPriorityId = item.dataset.priorityId;
  item.classList.add('dragging');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', state.draggedPriorityId);
});
selectedPriorities.addEventListener('dragover', (event) => {
  const item = event.target.closest('[data-priority-id]');
  if (!item || item.dataset.priorityId === state.draggedPriorityId) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
});
selectedPriorities.addEventListener('drop', (event) => {
  const item = event.target.closest('[data-priority-id]');
  const sourceId = event.dataTransfer.getData('text/plain') || state.draggedPriorityId;
  if (!item || !sourceId) return;
  event.preventDefault();
  reorderPriority(sourceId, item.dataset.priorityId);
});
selectedPriorities.addEventListener('dragend', () => {
  state.draggedPriorityId = null;
  selectedPriorities.querySelectorAll('.dragging').forEach((item) => item.classList.remove('dragging'));
});
$('[data-ranking-continue]').addEventListener('click', goToRatings);
$('[data-rating-card]').addEventListener('input', (event) => {
  const other = event.target.closest('[data-other-input]');
  if (!other) return;
  const area = currentRatingArea();
  const current = String(state.comments[area.id] || '')
    .replace(/(^|,\s*)Other(?::\s*[^,]*)?(?=,|$)/i, '')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .replace(/,\s*,/g, ', ');
  const otherValue = other.value.trim() ? `Other: ${other.value.trim()}` : 'Other';
  state.comments[area.id] = current ? `${current}, ${otherValue}` : otherValue;
  updatePayload();
});
$('[data-rating-card]').addEventListener('click', (event) => {
  const star = event.target.closest('[data-star-rating]');
  const chip = event.target.closest('[data-bother-chip]');
  if (chip) {
    const area = currentRatingArea();
    const text = chip.dataset.botherChip;
    const parts = String(state.comments[area.id] || '').split(',').map((part) => part.trim()).filter(Boolean);
    const existingIndex = parts.findIndex((part) => part.toLowerCase() === text.toLowerCase() || part.toLowerCase().startsWith(`${text.toLowerCase()}:`));
    if (existingIndex >= 0) {
      parts.splice(existingIndex, 1);
    } else {
      parts.push(text);
    }
    state.comments[area.id] = parts.join(', ');
    renderRatingCard();
    if (text.toLowerCase() === 'other' && existingIndex < 0) {
      requestAnimationFrame(() => $('[data-other-input]')?.focus());
    }
    return;
  }

  if (event.target.closest('[data-rating-ranking-back]')) backToAreaRanking();
  if (event.target.closest('[data-rating-next]')) ratingNext();
  if (event.target.closest('[data-rating-back]')) ratingBack();
});

window.faces3dWidget = {
  isComplete() {
    return state.photos.length === PHOTO_STEPS.length &&
      state.priorities.length === AREAS.length &&
      state.ratingStage === 'complete';
  },
  payload: updatePayload,
};

setStep('photos');
renderPhotos();
renderRanking();
updatePayload();
