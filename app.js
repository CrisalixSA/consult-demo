const questions = [
  'Do you understand the information you have been provided?',
  'Do you feel sufficient information has been provided to you, to enable you to consent?',
  'Has your consent been freely given?',
  'Do you have any medical conditions?',
  'Are you pregnant or breastfeeding?',
  'Do you have a neuromuscular disease (e.g. MS, ALS, motor neuropathy myasthenia gravis, or Lambert-Eaton syndrome)?',
  'Do you have an autoimmune disease?',
  'Do you have any skin conditions?',
  'Do you have any known allergies or have ever had anaphylaxis?',
  'Do you have any active infection at the intended site of procedure?',
  'Are you taking antibiotics or other prescription medications?',
  'Is there any other Medical and/or Social History that we should know? If so, please provide full detail here.',
  'What are your aims/motivations for having the procedure and the desired outcome? Please provide full details here.',
  'Have you had this or a similar treatment before? If so, did you experience any problems? Please provide full details here.',
  'Do you have any concerns? If so, please provide full details here.',
  'Is there anything else we should know? Please provide full details here.',
  'I will retain this information throughout the course of my treatment and refer to it as required.'
];

const questionList = document.getElementById('questionList');
questionList.innerHTML = questions.map((question, index) => {
  const name = `q${index + 1}`;
  return `
    <fieldset class="question" data-question="${name}">
      <legend>${question}</legend>
      <div class="choice-row boxed-choice-row">
        <label class="choice-card"><span>Yes</span><input type="radio" name="${name}" value="yes"></label>
        <label class="choice-card"><span>No</span><input type="radio" name="${name}" value="no"></label>
      </div>
      <input class="comment-input" name="${name}_comment" placeholder="Comments" />
    </fieldset>`;
}).join('');

const toggleDisclaimer = document.getElementById('toggleDisclaimer');
const disclaimerCopy = document.getElementById('disclaimerCopy');
const readMore = document.getElementById('readMore');
function setDisclaimerExpanded(expanded){
  toggleDisclaimer.setAttribute('aria-expanded', String(expanded));
  disclaimerCopy.classList.toggle('expanded', expanded);
  disclaimerCopy.classList.toggle('collapsed', !expanded);
  readMore.textContent = expanded ? 'Read less' : 'Read more';
}
toggleDisclaimer.addEventListener('click', () => setDisclaimerExpanded(toggleDisclaimer.getAttribute('aria-expanded') !== 'true'));
readMore.addEventListener('click', () => setDisclaimerExpanded(toggleDisclaimer.getAttribute('aria-expanded') !== 'true'));

for (const button of document.querySelectorAll('.upload-tile')) {
  button.addEventListener('click', () => {
    button.classList.add('selected');
    if (!button.querySelector('.fake-status')) {
      const status = document.createElement('span');
      status.className = 'fake-status';
      status.textContent = ' · added for demo';
      status.style.fontWeight = '700';
      status.style.opacity = '.85';
      button.appendChild(status);
    }
  });
}

document.querySelectorAll('.question').forEach((fieldset) => {
  fieldset.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.addEventListener('change', () => {
      fieldset.querySelectorAll('.choice-card').forEach((card) => {
        card.classList.toggle('selected', card.querySelector('input')?.checked === true);
      });
    });
  });
});

const canvas = document.getElementById('signatureCanvas');
const pad = document.getElementById('signaturePad');
const ctx = canvas.getContext('2d');
let drawing = false;
let signed = false;
function resizeCanvas(){
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const img = signed ? canvas.toDataURL() : null;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  ctx.scale(ratio, ratio);
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#15171d';
  if (img) {
    const image = new Image();
    image.onload = () => ctx.drawImage(image, 0, 0, rect.width, rect.height);
    image.src = img;
  }
}
setTimeout(resizeCanvas, 0);
window.addEventListener('resize', resizeCanvas);
function point(event){
  const rect = canvas.getBoundingClientRect();
  const source = event.touches ? event.touches[0] : event;
  return { x: source.clientX - rect.left, y: source.clientY - rect.top };
}
function start(event){
  drawing = true;
  signed = true;
  pad.classList.add('signed');
  const p = point(event);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  event.preventDefault();
}
function draw(event){
  if (!drawing) return;
  const p = point(event);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  event.preventDefault();
}
function stop(){ drawing = false; }
canvas.addEventListener('mousedown', start);
canvas.addEventListener('mousemove', draw);
window.addEventListener('mouseup', stop);
canvas.addEventListener('touchstart', start, {passive:false});
canvas.addEventListener('touchmove', draw, {passive:false});
window.addEventListener('touchend', stop);
document.getElementById('clearSignature').addEventListener('click', () => {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  signed = false;
  pad.classList.remove('signed');
});

const form = document.getElementById('consentForm');
const modal = document.getElementById('successModal');
const face3dError = document.getElementById('face3dError');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const widgetComplete = window.faces3dWidget?.isComplete?.() === true;
  face3dError.hidden = widgetComplete;
  if (!widgetComplete) {
    document.getElementById('face3dWidget').scrollIntoView({behavior:'smooth', block:'center'});
    return;
  }
  const marketing = form.querySelector('input[name="marketing"]:checked');
  const marketingField = document.querySelector('.marketing-question');
  marketingField.classList.toggle('show-error', !marketing);
  if (!marketing) {
    marketingField.scrollIntoView({behavior:'smooth', block:'center'});
    return;
  }
  showClinicAppointments();
});
document.getElementById('closeSuccess').addEventListener('click', () => modal.setAttribute('aria-hidden','true'));
modal.addEventListener('click', (event) => {
  if (event.target === modal) modal.setAttribute('aria-hidden','true');
});
