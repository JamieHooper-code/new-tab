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

  saveChecklist(panel.id, items);
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

// ── Static panels ──

function loadStaticItems(panel) {
  try {
    const saved = localStorage.getItem('static_' + panel.id);
    if (saved) return JSON.parse(saved);
  } catch {}
  return panel.items.map(i => typeof i === 'string' ? { text: i, tag: null } : { text: i.text, tag: i.tag || null });
}

function saveStaticItems(id, items) {
  localStorage.setItem('static_' + id, JSON.stringify(items));
}

function renderStatic(panel, containerEl) {
  if (!localStorage.getItem('static_' + panel.id)) {
    saveStaticItems(panel.id, loadStaticItems(panel));
  }

  let editMode = false;
  const wrapper = document.createElement('div');

  function rebuild() {
    wrapper.innerHTML = '';
    const items = loadStaticItems(panel);
    const hasTags = items.some(i => i.tag);

    if (!editMode) {
      const list = document.createElement('ul');
      list.className = 'static-list' + (hasTags ? ' has-tags' : '');
      for (const item of items) {
        const li = document.createElement('li');
        li.appendChild(document.createTextNode(item.text));
        if (item.tag) {
          const tagEl = document.createElement('span');
          tagEl.className = 'tag tag-' + item.tag;
          tagEl.textContent = item.tag;
          li.appendChild(tagEl);
        }
        list.appendChild(li);
      }
      wrapper.appendChild(list);
    } else {
      const editList = document.createElement('div');
      editList.className = 'edit-list';

      items.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'edit-row';

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = item.text;
        textInput.className = 'edit-text-input';
        textInput.addEventListener('blur', () => {
          const val = textInput.value.trim();
          if (val) { items[idx].text = val; saveStaticItems(panel.id, items); }
        });
        textInput.addEventListener('keydown', e => {
          if (e.key === 'Enter') textInput.blur();
        });

        const del = document.createElement('button');
        del.className = 'del-btn static-del';
        del.textContent = '×';
        del.addEventListener('click', () => {
          items.splice(idx, 1);
          saveStaticItems(panel.id, items);
          rebuild();
        });

        row.append(textInput);

        if (hasTags) {
          const tagSel = document.createElement('select');
          tagSel.className = 'tag-select';
          [['daily','daily'], ['weekly','weekly'], ['anytime','anytime'], ['—','']].forEach(([label, val]) => {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = label;
            if ((item.tag || '') === val) opt.selected = true;
            tagSel.appendChild(opt);
          });
          tagSel.addEventListener('change', () => {
            items[idx].tag = tagSel.value || null;
            saveStaticItems(panel.id, items);
          });
          row.appendChild(tagSel);
        }

        row.appendChild(del);
        editList.appendChild(row);
      });

      // Add row
      const addRow = document.createElement('div');
      addRow.className = 'add-row';
      const newInput = document.createElement('input');
      newInput.type = 'text';
      newInput.placeholder = 'Add item…';

      let tagSel = null;
      if (hasTags) {
        tagSel = document.createElement('select');
        tagSel.className = 'tag-select';
        ['daily', 'weekly', 'anytime'].forEach(t => {
          const opt = document.createElement('option');
          opt.value = t;
          opt.textContent = t;
          tagSel.appendChild(opt);
        });
        addRow.appendChild(newInput);
        addRow.appendChild(tagSel);
      } else {
        addRow.appendChild(newInput);
      }

      const addBtn = document.createElement('button');
      addBtn.textContent = 'Add';
      addRow.appendChild(addBtn);

      function addItem() {
        const text = newInput.value.trim();
        if (!text) return;
        items.push({ text, tag: tagSel ? tagSel.value : null });
        saveStaticItems(panel.id, items);
        newInput.value = '';
        rebuild();
      }

      addBtn.addEventListener('click', addItem);
      newInput.addEventListener('keydown', e => { if (e.key === 'Enter') addItem(); });

      wrapper.append(editList, addRow);
    }
  }

  rebuild();
  containerEl.appendChild(wrapper);

  return {
    toggleEdit() {
      editMode = !editMode;
      rebuild();
      return editMode;
    }
  };
}

// ── Panel builder ──

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

  const title = document.createElement('div');
  title.className = 'panel-title';

  const grip = document.createElement('span');
  grip.className = 'grip';
  grip.textContent = '⠿';
  grip.title = 'Drag to reorder';

  const label = document.createElement('span');
  label.className = 'panel-label';
  label.textContent = panel.title;

  title.append(grip, label);
  el.appendChild(title);

  if (panel.type === 'checklist') {
    renderChecklist(panel, el);
  } else {
    const { toggleEdit } = renderStatic(panel, el);
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-toggle-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', e => {
      e.stopPropagation();
      const nowEditing = toggleEdit();
      editBtn.textContent = nowEditing ? 'Done' : 'Edit';
    });
    title.appendChild(editBtn);
  }

  return el;
}

// ── Drag ──

const board = document.getElementById('board');

function initDrag(el) {
  let ghost = null;
  let offsetX = 0, offsetY = 0;
  let active = false;
  let dropTarget = null;
  let dropBefore = false;

  function onStart(clientX, clientY) {
    const rect = el.getBoundingClientRect();
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;

    ghost = el.cloneNode(true);
    ghost.classList.add('panel-ghost');
    ghost.style.width  = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    ghost.style.top    = rect.top + 'px';
    ghost.style.left   = rect.left + 'px';
    document.body.appendChild(ghost);

    el.classList.add('dragging');
    active = true;
  }

  function onMove(clientX, clientY) {
    if (!active) return;
    ghost.style.top  = (clientY - offsetY) + 'px';
    ghost.style.left = (clientX - offsetX) + 'px';

    ghost.style.pointerEvents = 'none';
    const under = document.elementFromPoint(clientX, clientY);
    ghost.style.pointerEvents = '';

    document.querySelectorAll('.panel').forEach(p => p.classList.remove('drop-before', 'drop-after'));

    const target = under && under.closest('.panel:not(.dragging)');
    if (target) {
      const r = target.getBoundingClientRect();
      dropBefore = clientY < r.top + r.height / 2;
      dropTarget = target;
      target.classList.add(dropBefore ? 'drop-before' : 'drop-after');
    } else {
      dropTarget = null;
    }
  }

  function onEnd() {
    if (!active) return;
    active = false;

    if (dropTarget) {
      if (dropBefore) dropTarget.before(el);
      else dropTarget.after(el);
    }

    ghost.remove();
    el.classList.remove('dragging');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('drop-before', 'drop-after'));
    ghost = null;
    dropTarget = null;
    saveOrder();
  }

  const titleBar = el.querySelector('.panel-title');

  titleBar.addEventListener('touchstart', e => {
    if (e.target.closest('.edit-toggle-btn')) return;
    e.preventDefault();
    const t = e.touches[0];
    onStart(t.clientX, t.clientY);
  }, { passive: false });

  titleBar.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0];
    onMove(t.clientX, t.clientY);
  }, { passive: false });

  titleBar.addEventListener('touchend', onEnd);
  titleBar.addEventListener('touchcancel', onEnd);

  titleBar.addEventListener('mousedown', e => {
    if (e.target.closest('.edit-toggle-btn')) return;
    e.preventDefault();
    onStart(e.clientX, e.clientY);
    const onMouseMove = e => onMove(e.clientX, e.clientY);
    const onMouseUp = () => {
      onEnd();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

for (const panel of orderedPanels()) {
  const el = buildPanel(panel);
  initDrag(el);
  board.appendChild(el);
}
