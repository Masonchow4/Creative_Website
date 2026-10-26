const moodButtons = [...document.querySelectorAll('.mood-option')];
const colorButtons = [...document.querySelectorAll('.color-option')];
const moodDescriptions = {
  Minimal: 'A clean silhouette with a cool, considered palette. Easy to wear, made to feel like you.',
  Street: 'An easy layer with a little edge. A confident mix of everyday comfort and your own point of view.',
  Classic: 'A timeless shape with a fresh finish. Put-together, versatile, and ready to go wherever you do.'
};
const colorLabels = {
  'Midnight blue': '#9dbaff',
  'Warm neutrals': '#d5b48e',
  'Soft lavender': '#c2aaff',
  'Fresh green': '#a7dfbd'
};
let selectedMood = 'Minimal';
let selectedColor = 'Midnight blue';

moodButtons.forEach(button => button.addEventListener('click', () => {
  selectedMood = button.dataset.mood;
  moodButtons.forEach(item => {
    const isSelected = item === button;
    item.classList.toggle('selected', isSelected);
    item.setAttribute('aria-pressed', String(isSelected));
  });
  updatePreview();
}));

colorButtons.forEach(button => button.addEventListener('click', () => {
  selectedColor = button.dataset.color;
  colorButtons.forEach(item => {
    const isSelected = item === button;
    item.classList.toggle('active', isSelected);
    item.setAttribute('aria-pressed', String(isSelected));
  });
  updatePreview();
}));

function updatePreview() {
  document.querySelector('#preview-title').textContent = `${selectedMood} / ${selectedColor}`;
  document.querySelector('#preview-description').textContent = moodDescriptions[selectedMood];
  document.querySelector('#preview-panel').style.setProperty('--accent', colorLabels[selectedColor]);
}

const toast = document.querySelector('#toast');
let toastTimer;
document.querySelector('#build-look').addEventListener('click', () => {
  const occasion = document.querySelector('#occasion').value.toLowerCase();
  updatePreview();
  toast.textContent = `STYLE PREVIEW READY · ${selectedMood.toUpperCase()} FOR ${occasion.toUpperCase()}`;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3200);
});

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.desktop-nav');
menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
  navigation.classList.toggle('open', !isOpen);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
  navigation.classList.remove('open');
}));

const clothingInput = document.querySelector('#clothing-link');
const clothingList = document.querySelector('#clothing-link-list');
const linkHint = document.querySelector('#link-hint');
const clothingLinks = [];

function renderClothingLinks() {
  clothingList.replaceChildren();
  clothingLinks.forEach((url, index) => {
    const item = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = url;
    label.title = url;
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.setAttribute('aria-label', `Remove clothing link ${index + 1}`);
    removeButton.textContent = '×';
    removeButton.addEventListener('click', () => {
      clothingLinks.splice(index, 1);
      renderClothingLinks();
    });
    item.append(label, removeButton);
    clothingList.append(item);
  });
}

function addClothingLink() {
  const value = clothingInput.value.trim();
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    parsed = null;
  }
  if (!parsed || !['http:', 'https:'].includes(parsed.protocol)) {
    linkHint.textContent = 'Enter a full link beginning with https://';
    linkHint.classList.add('error');
    clothingInput.focus();
    return;
  }
  if (!clothingLinks.includes(parsed.href)) clothingLinks.push(parsed.href);
  clothingInput.value = '';
  linkHint.textContent = `${clothingLinks.length} clothing ${clothingLinks.length === 1 ? 'link' : 'links'} added to this preview.`;
  linkHint.classList.remove('error');
  renderClothingLinks();
}

document.querySelector('#add-clothing-link').addEventListener('click', addClothingLink);
clothingInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addClothingLink();
  }
});

const styleNotes = document.querySelector('#style-notes');
const notesFeedback = document.querySelector('#notes-feedback');
document.querySelectorAll('.note-prompts button').forEach(button => button.addEventListener('click', () => {
  const note = button.dataset.note;
  const current = styleNotes.value.trim();
  if (!current.includes(note)) styleNotes.value = current ? `${current}${/[.!?]$/.test(current) ? ' ' : '. '}${note}.` : `${note}.`;
  styleNotes.focus();
  notesFeedback.textContent = 'Added to your style notes.';
}));
styleNotes.addEventListener('input', () => {
  notesFeedback.textContent = styleNotes.value.trim() ? 'Your style notes are ready.' : 'Your notes help shape the style direction.';
});
