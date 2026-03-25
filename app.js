// ============================================================
//  APP LOGIC — no need to edit this file
// ============================================================

function loadChecklist(id) {
  try { return JSON.parse(localStorage.getItem('panel_' + id)) || []; }
  catch { return []; }
}

function saveChecklist(id, items) {
  localStorage.setItem('panel_' + id, JSON.stringify(items));
}

function mergeInitialItems(id, configItems) {
  const saved = loadChecklist(id);
  const savedTexts = new Set(saved.map(i => i.text));
  const merged = [...saved];
  for (const text of configItems) {
    if (!savedTexts.has(text)) merged.push({ text, done: false });
  }
  return merged;
}

function renderChecklist(panel, containerEl) {
  const items = mergeInitialItems(panel.id, panel.items);

  const list = document.createElement('ul');
  list.className = 'checklist';

  function rebuild() {
    list.innerHTML = '';
    const current = loadChecklist(panel.id);
    current.forEach((item, idx) => {
      const li = document.createElement('li');
      if (item.done) li.classList.add('done');

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = item.done;
      cb.addEventListener('change', () => {
        current[idx].done = cb.checked;
        saveChecklist(panel.id, current);
        rebuild();
      });

      const span = document.createElement('span');
      span.textContent = item.text;
      span.addEventListener('click', () => { cb.click(); });

      const del = document.createElement('button');
      del.className = 'del-btn';
      del.textContent = '×';
      del.title = 'Remove';
      del.addEventListener('click', () => {
        current.splice(idx, 1);
        saveChecklist(panel.id, current);
        rebuild();
      });

      li.append(cb, span, del);
      list.appendChild(li);
    });
  }

  if (!localStorage.getItem('panel_' + panel.id)) {
    saveChecklist(panel.id, items);
  }
  rebuild();
  containerEl.appendChild(list);

  const addRow = document.createElement('div');
  addRow.className = 'add-row';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Add item…';
  const addBtn = document.createElement('button');
  addBtn.textContent = 'Add';

  function addItem() {
    const text = input.value.trim();
    if (!text) return;
    const current = loadChecklist(panel.id);
    current.push({ text, done: false });
    saveChecklist(panel.id, current);
    input.value = '';
    rebuild();
  }

  addBtn.addEventListener('click', addItem);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') addItem(); });
  addRow.append(input, addBtn);
  containerEl.appendChild(addRow);

  const clearBtn = document.createElement('button');
  clearBtn.className = 'clear-btn';
  clearBtn.textContent = 'Clear completed';
  clearBtn.addEventListener('click', () => {
    const current = loadChecklist(panel.id).filter(i => !i.done);
    saveChecklist(panel.id, current);
    rebuild();
  });
  containerEl.appendChild(clearBtn);
}

function renderStatic(panel, containerEl) {
  const hasTags = panel.items.some(i => typeof i === 'object' && i.tag);
  const list = document.createElement('ul');
  list.className = 'static-list' + (hasTags ? ' has-tags' : '');

  for (const item of panel.items) {
    const li = document.createElement('li');
    const text = typeof item === 'string' ? item : item.text;
    const tag  = typeof item === 'object' ? item.tag : null;

    li.appendChild(document.createTextNode(text));

    if (tag) {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag tag-' + tag;
      tagEl.textContent = tag;
      li.appendChild(tagEl);
    }
    list.appendChild(li);
  }
  containerEl.appendChild(list);
}

function loadOrder() {
  try { return JSON.parse(localStorage.getItem('panel_order')) || null; }
  catch { return null; }
}

function saveOrder() {
  const ids = [...document.querySelectorAll('.panel')].map(el => el.dataset.id);
  localStorage.setItem('panel_order', JSON.stringify(ids));
}

function orderedPanels() {
  const order = loadOrder();
  if (!order) return PANELS;
  return [
    ...order.map(id => PANELS.find(p => p.id === id)).filter(Boolean),
    ...PANELS.filter(p => !order.includes(p.id))
  ];
}

function buildPanel(panel) {
  const el = document.createElement('div');
  el.className = 'panel';
  el.dataset.id = panel.id;
  el.draggable = true;

  const title = document.createElement('div');
  title.className = 'panel-title';

  const grip = document.createElement('span');
  grip.className = 'grip';
  grip.textContent = '⠿';
  grip.title = 'Drag to reorder';

  const label = document.createElement('span');
  label.textContent = panel.title;

  title.append(grip, label);
  el.appendChild(title);

  if (panel.type === 'checklist') renderChecklist(panel, el);
  else renderStatic(panel, el);

  return el;
}

const board = document.getElementById('board');
let dragSrc = null;

function reorderPanel(el, clientX, clientY) {
  el.style.pointerEvents = 'none';
  const under = document.elementFromPoint(clientX, clientY);
  el.style.pointerEvents = '';
  const target = under && under.closest('.panel');
  if (!target || target === el) return;
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('drag-over'));
  target.classList.add('drag-over');
  const panels = [...board.querySelectorAll('.panel')];
  if (panels.indexOf(el) < panels.indexOf(target)) target.after(el);
  else target.before(el);
}

function initDrag(el) {
  // ── Mouse drag ──
  el.addEventListener('dragstart', e => {
    dragSrc = el;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => el.classList.add('dragging'), 0);
  });
  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('drag-over'));
    saveOrder();
  });
  el.addEventListener('dragover', e => {
    e.preventDefault();
    if (el === dragSrc) return;
    reorderPanel(dragSrc, e.clientX, e.clientY);
  });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));

  // ── Touch drag (whole title bar) ──
  const titleBar = el.querySelector('.panel-title');
  let touching = false;

  titleBar.addEventListener('touchstart', e => {
    touching = true;
    el.classList.add('dragging');
    e.preventDefault();
  }, { passive: false });

  titleBar.addEventListener('touchmove', e => {
    if (!touching) return;
    e.preventDefault();
    const t = e.touches[0];
    reorderPanel(el, t.clientX, t.clientY);
  }, { passive: false });

  titleBar.addEventListener('touchend', () => {
    touching = false;
    el.classList.remove('dragging');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('drag-over'));
    saveOrder();
  });
}

for (const panel of orderedPanels()) {
  const el = buildPanel(panel);
  initDrag(el);
  board.appendChild(el);
}
