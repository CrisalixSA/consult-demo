import {
  Engine,
  SimulationType,
  CameraFocusPoint,
} from './js/3ngine.module.js';

const AREAS = [
  { id: 'frontal', name: 'Forehead', subtitle: 'Forehead', concerns: ['Horizontal forehead lines', 'Heavy brow'] },
  { id: 'orbital', name: 'Eyes', subtitle: 'Eye area', concerns: ['Dark circles', "Crow's feet"] },
  { id: 'nasal', name: 'Nose', subtitle: 'Nose', concerns: ['Bridge shape', 'Tip position'] },
  { id: 'zygomatic', name: 'Cheeks', subtitle: 'Cheeks', concerns: ['Mid-face volume loss', 'Cheek sagging'] },
  { id: 'buccal', name: 'Nasolabial', subtitle: 'Nasolabial folds', concerns: ['Lines or wrinkles', 'Texture or pigmentation'] },
  { id: 'oral', name: 'Mouth', subtitle: 'Mouth / lips', concerns: ['Lip volume loss', 'Lip border definition'] },
  { id: 'mental', name: 'Chin', subtitle: 'Chin', concerns: ['Profile balance', 'Chin dimpling'] },
  { id: 'auricular', name: 'Jaw', subtitle: 'Jaw / neck', concerns: ['Soft jawline', 'Jowls'] },
];

const TREATMENTS_BY_AREA = {
  frontal: [
    { id: 'anti-wrinkle-forehead', name: 'Anti-wrinkle forehead treatment', price: 145, note: 'Softens horizontal forehead movement' },
    { id: 'skin-booster-forehead', name: 'Skin booster glow session', price: 220, note: 'Hydration and fine-line skin quality support' },
  ],
  orbital: [
    { id: 'tear-trough-consult', name: 'Under-eye rejuvenation consult', price: 175, note: 'Dark circles, hollowness and tired-eye review' },
    { id: 'polynucleotide-eyes', name: 'Polynucleotide eye treatment', price: 260, note: 'Skin quality and regenerative under-eye option' },
  ],
  nasal: [
    { id: 'non-surgical-rhinoplasty', name: 'Non-surgical rhinoplasty assessment', price: 295, note: 'Bridge and tip profile balancing' },
    { id: 'nose-tox-review', name: 'Nasal refinement review', price: 125, note: 'Small dynamic refinements to discuss' },
  ],
  zygomatic: [
    { id: 'cheek-contour-filler', name: 'Cheek contour filler', price: 320, note: 'Mid-face support and contour definition' },
    { id: 'collagen-cheeks', name: 'Collagen stimulation cheeks', price: 360, note: 'Skin quality and volume-support option' },
  ],
  buccal: [
    { id: 'nasolabial-softening', name: 'Nasolabial fold softening', price: 280, note: 'Softens folds around smile lines' },
    { id: 'rf-microneedling-midface', name: 'RF microneedling mid-face', price: 240, note: 'Texture, firmness and collagen support' },
  ],
  oral: [
    { id: 'lip-filler-enhancement', name: 'Lip hydration / definition filler', price: 199, note: 'Natural lip shape, border and hydration' },
    { id: 'perioral-lines', name: 'Perioral line softening', price: 180, note: 'Fine lines around the mouth' },
  ],
  mental: [
    { id: 'chin-profile-balancing', name: 'Chin profile balancing', price: 260, note: 'Profile projection and lower-face balance' },
    { id: 'chin-dimpling-tox', name: 'Chin dimpling treatment', price: 125, note: 'Softens mentalis dimpling' },
  ],
  auricular: [
    { id: 'jawline-contouring', name: 'Jawline contouring', price: 340, note: 'Definition and lower-face structure' },
    { id: 'neck-firmness-consult', name: 'Jaw / neck firmness consult', price: 210, note: 'Jowls, laxity and collagen-support options' },
  ],
};

const HOTSPOT_POSITIONS = {
  frontal: { x: 50, y: 22 },
  orbital: { x: 50, y: 35 },
  nasal: { x: 51, y: 46 },
  zygomatic: { x: 33, y: 47 },
  buccal: { x: 37, y: 58 },
  oral: { x: 50, y: 66 },
  mental: { x: 50, y: 75 },
  auricular: { x: 69, y: 65 },
};

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

let clinicEngine = null;
let clinicReady = false;
let currentArea = AREAS[0].id;
const selectedTreatments = [
  { id: 'lip-filler', name: '1ml Lip filler', price: 199, base: true },
];

const $ = (selector) => document.querySelector(selector);
const formatPrice = (price) => `£${price.toFixed(2)}`;
const treatmentById = (id) => Object.values(TREATMENTS_BY_AREA).flat().find((treatment) => treatment.id === id);
const isTreatmentSelected = (id) => selectedTreatments.some((treatment) => treatment.id === id);

function updateRoute(path, replace = false) {
  if (window.location.pathname === path) return;
  const url = `${path}${window.location.search || ''}`;
  const method = replace ? 'replaceState' : 'pushState';
  window.history[method]({ clinicView: path }, '', url);
}

function showOnly(view, options = {}) {
  const { route = true, replace = false } = options;
  $('.phone-shell').hidden = view !== 'consent';
  $('#clinicAppointments').hidden = view !== 'appointments';
  $('#clinicProfile').hidden = view !== 'profile';
  document.body.classList.toggle('clinic-mode', view !== 'consent');
  if (route) {
    if (view === 'profile') updateRoute('/clinic', replace);
    if (view === 'appointments') updateRoute('/clinic/appointments', replace);
    if (view === 'consent') updateRoute('/', replace);
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

window.showClinicAppointments = function showClinicAppointments(options = {}) {
  showOnly('appointments', options);
};

window.showClinicProfile = async function showClinicProfile(options = {}) {
  showOnly('profile', options);
  renderClinicAreaList();
  render3dHotspots();
  renderTreatmentSummary();
  await initClinicReview3d();
  focusArea(currentArea);
};

function renderTreatmentOptions(area) {
  const treatments = TREATMENTS_BY_AREA[area.id] || [];
  const concernSummary = (area.concerns || []).join(', ');
  return `
    <span class="clinic-treatment-accordion" data-treatment-accordion="${area.id}">
      <span class="clinic-treatment-heading">
        <b>Treatment opportunities</b>
        <small>Based on: ${concernSummary}</small>
      </span>
      ${treatments.map((treatment) => {
        const selected = isTreatmentSelected(treatment.id);
        return `
          <span class="clinic-treatment-option ${selected ? 'added' : ''}">
            <span>
              <strong>${treatment.name}</strong>
              <small>${treatment.note}</small>
            </span>
            <em>${formatPrice(treatment.price)}</em>
            <button type="button" data-add-treatment="${treatment.id}" ${selected ? 'disabled' : ''}>${selected ? 'Added' : 'Add'}</button>
          </span>
        `;
      }).join('')}
    </span>
  `;
}

function renderConcernChips(area) {
  return (area.concerns || []).map((concern) => `<span class="clinic-concern-chip">${concern}</span>`).join('');
}

function renderClinicAreaList() {
  const list = $('[data-clinic-area-list]');
  if (!list) return;
  list.innerHTML = AREAS.map((area, index) => `
    <div role="button" tabindex="0" class="clinic-area-answer ${area.id === currentArea ? 'active' : ''}" data-clinic-area="${area.id}" aria-expanded="${area.id === currentArea}">
      <span class="answer-rank">${index + 1}</span>
      <span class="answer-body">
        <strong>${area.name}</strong>
        <small>Priority ${index + 1}/8 · Patient selected concerns</small>
        <em>Which of the following concerns matter most to you?</em>
        <span class="clinic-concern-row">${renderConcernChips(area)}</span>
        ${area.id === currentArea ? renderTreatmentOptions(area) : ''}
      </span>
    </div>
  `).join('');
}

function render3dHotspots() {
  const host = $('[data-clinic-3d-hotspots]');
  if (!host) return;
  host.innerHTML = '';
}

function renderTreatmentSummary() {
  const list = $('[data-treatment-list]');
  const total = $('[data-treatment-total]');
  if (!list || !total) return;
  list.innerHTML = selectedTreatments.map((treatment) => `
    <div class="payment-line ${treatment.base ? 'base-treatment' : 'added-treatment'}" data-treatment-id="${treatment.id}">
      <span>${treatment.base ? '⌑' : '+'}</span>
      <p>${treatment.name}</p>
      <strong>${formatPrice(treatment.price)}</strong>
    </div>
  `).join('');
  const totalValue = selectedTreatments.reduce((sum, treatment) => sum + treatment.price, 0);
  total.textContent = formatPrice(totalValue);
}

function addTreatment(treatmentId) {
  if (isTreatmentSelected(treatmentId)) return;
  const treatment = treatmentById(treatmentId);
  if (!treatment) return;
  selectedTreatments.push(treatment);
  renderTreatmentSummary();
  renderClinicAreaList();
  render3dHotspots();
  const paymentPanel = $('.profile-payment-panel');
  const leftPane = $('.profile-left-pane');
  paymentPanel?.classList.add('treatment-added-pulse');
  requestAnimationFrame(() => {
    if (leftPane) {
      leftPane.scrollTop = leftPane.scrollHeight;
      leftPane.scrollTo({ top: leftPane.scrollHeight, behavior: 'smooth' });
      setTimeout(() => { leftPane.scrollTop = leftPane.scrollHeight; }, 240);
    }
    paymentPanel?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  });
  setTimeout(() => paymentPanel?.classList.remove('treatment-added-pulse'), 700);
}

async function initClinicReview3d() {
  if (clinicEngine) return;
  const canvas = $('[data-clinic-review-canvas]');
  if (!canvas) return;
  try {
    clinicEngine = new Engine();
    await clinicEngine.start({
      canvas: { before: canvas, dragZone: canvas },
      patient: ENGINE_PATIENT,
    });
    clinicReady = true;
    try { clinicEngine.toggleCameraZoom(true); } catch (_) {}
    try { clinicEngine.enableAutoRotation(8, -30, 30, 0, 0); } catch (_) {}
    $('[data-clinic-review-loading]')?.classList.add('hidden');
  } catch (err) {
    console.error('[clinic-view] 3D init failed', err);
    const loading = $('[data-clinic-review-loading]');
    if (loading) loading.textContent = '3D failed to load';
  }
}

function focusArea(areaId) {
  currentArea = areaId;
  renderClinicAreaList();
  render3dHotspots();
  const activeAnswer = document.querySelector(`.clinic-area-answer[data-clinic-area="${areaId}"]`);
  activeAnswer?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  if (!clinicReady || !clinicEngine) return;
  const cfg = REGION_CAMERA_MAP[areaId];
  if (!cfg) return;
  try { clinicEngine.disableAutoRotation(); } catch (_) {}
  const done = () => {
    try { clinicEngine.setCameraZoom(cfg.zoom, true); } catch (_) {}
    try { clinicEngine.enableAutoRotation(8, -30, 30, 0, 0); } catch (_) {}
  };
  try {
    const point = CameraFocusPoint?.[cfg.point];
    const result = point ? clinicEngine.focusCamera(point, cfg.az, cfg.pol) : null;
    if (result && typeof result.then === 'function') result.then(done).catch(done);
    else done();
  } catch (_) { done(); }
}

document.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-add-treatment]');
  if (addButton) {
    event.preventDefault();
    event.stopPropagation();
    addTreatment(addButton.dataset.addTreatment);
    return;
  }
  if (event.target.closest('[data-back-to-consent]')) showOnly('consent');
  if (event.target.closest('[data-back-to-appointments]')) showClinicAppointments();
  if (event.target.closest('[data-open-clinic-profile]')) {
    event.preventDefault();
    window.showClinicProfile();
  }
  const areaButton = event.target.closest('[data-clinic-area]');
  if (areaButton) focusArea(areaButton.dataset.clinicArea);
});

function routeFromLocation(replace = true) {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/clinic') {
    window.showClinicProfile({ replace });
  } else if (path === '/clinic/appointments') {
    window.showClinicAppointments({ replace });
  } else {
    showOnly('consent', { replace });
  }
}

window.addEventListener('popstate', () => routeFromLocation(true));

renderClinicAreaList();
renderTreatmentSummary();
routeFromLocation(true);
