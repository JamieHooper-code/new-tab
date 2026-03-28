// ============================================================
//  APP LOGIC — no need to edit this file
// ============================================================

// ── Item-level drag reorder ──────────────────────────────────

function attachItemDrag(li, listEl, idx, getItems, saveItems, rebuild) {
  let ghost = null, active = false;
  let offsetX = 0, offsetY = 0;
  let dropTarget = null, dropBefore = false;

  const grip = li.querySelector('.item-grip');

  function onStart(clientX, clientY) {
    const rect = li.getBoundingClientRect();
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;

    ghost = li.cloneNode(true);
    ghost.classList.add('item-ghost');
    ghost.style.width = rect.width + 'px';
    ghost.style.top   = rect.top + 'px';
    ghost.style.left  = rect.left + 'px';
    document.body.appendChild(ghost);

    li.classList.add('item-dragging');
    active = true;
  }

  function onMove(clientX, clientY) {
    if (!active) return;
    ghost.style.top  = (clientY - offsetY) + 'px';
    ghost.style.left = (clientX - offsetX) + 'px';

    ghost.style.pointerEvents = 'none';
    const under = document.elementFromPoint(clientX, clientY);
    ghost.style.pointerEvents = '';

    listEl.querySelectorAll('.item-drop-before, .item-drop-after')
      .forEach(el => el.classList.remove('item-drop-before', 'item-drop-after'));

    const target = under && under.closest('li:not(.item-dragging), div.edit-row:not(.item-dragging)');
    if (target && target.closest('ul, .edit-list') === listEl) {
      const r = target.getBoundingClientRect();
      dropBefore = clientY < r.top + r.height / 2;
      dropTarget = target;
      target.classList.add(dropBefore ? 'item-drop-before' : 'item-drop-after');
    } else {
      dropTarget = null;
    }
  }

  function onEnd() {
    if (!active) return;
    active = false;
    ghost.remove();
    li.classList.remove('item-dragging');
    listEl.querySelectorAll('.item-drop-before, .item-drop-after')
      .forEach(el => el.classList.remove('item-drop-before', 'item-drop-after'));

    if (dropTarget) {
      const toIdx = parseInt(dropTarget.dataset.idx);
      const items = getItems();
      const [moved] = items.splice(idx, 1);
      const targetIdx = toIdx > idx ? toIdx - 1 : toIdx;
      const insertAt = dropBefore ? targetIdx : targetIdx + 1;
      items.splice(insertAt, 0, moved);
      saveItems(items);
      rebuild();
    }
    ghost = null;
    dropTarget = null;
  }

  grip.addEventListener('touchstart', e => {
    e.preventDefault();
    e.stopPropagation();
    onStart(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  grip.addEventListener('touchmove', e => {
    e.preventDefault();
    e.stopPropagation();
    onMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  grip.addEventListener('touchend', onEnd);
  grip.addEventListener('touchcancel', onEnd);

  grip.addEventListener('mousedown', e => {
    e.preventDefault();
    e.stopPropagation();
    onStart(e.clientX, e.clientY);
    const mm = e => onMove(e.clientX, e.clientY);
    const mu = () => { onEnd(); document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); };
    document.addEventListener('mousemove', mm);
    document.addEventListener('mouseup', mu);
  });
}

// ── Display mode helpers ──────────────────────────────────────

function loadPanelCfg(id, defaults = { mode: 'all', limit: 5 }) {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem('panel_cfg_' + id)) }; }
  catch { return { ...defaults }; }
}

function savePanelCfg(id, cfg) {
  localStorage.setItem('panel_cfg_' + id, JSON.stringify(cfg));
}

const _randomCache = new Map();

function getDisplayItems(id, items, cfg) {
  if (cfg.mode === 'first') return items.slice(0, cfg.limit);
  if (cfg.mode === 'random') {
    if (!_randomCache.has(id) || _randomCache.get(id).src !== items.length) {
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      _randomCache.set(id, { src: items.length, shuffled });
    }
    return _randomCache.get(id).shuffled.slice(0, cfg.limit);
  }
  return items; // 'all' and 'scroll' show everything
}

// ── Checklist panels ─────────────────────────────────────────

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
    list.style.maxHeight = '';
    list.style.overflowY = '';
    const all = loadChecklist(panel.id);
    const cfg = loadPanelCfg(panel.id, panel.defaultCfg);
    if (cfg.mode === 'scroll') {
      list.style.maxHeight = '220px';
      list.style.overflowY = 'auto';
    }
    const current = getDisplayItems(panel.id, all, cfg);
    const showDrag = cfg.mode !== 'random';
    current.forEach((item, idx) => {
      const li = document.createElement('li');
      li.dataset.idx = idx;
      if (item.done) li.classList.add('done');

      const grip = document.createElement('span');
      grip.className = 'item-grip';
      grip.textContent = '⠿';
      if (!showDrag) grip.style.display = 'none';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = item.done;
      cb.addEventListener('change', () => {
        const full = loadChecklist(panel.id);
        const realIdx = full.findIndex(i => i.text === item.text);
        if (realIdx !== -1) full[realIdx].done = cb.checked;
        const reordered = [...full.filter(i => !i.done), ...full.filter(i => i.done)];
        saveChecklist(panel.id, reordered);
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
        const full = loadChecklist(panel.id);
        const realIdx = full.findIndex(i => i.text === item.text);
        if (realIdx !== -1) full.splice(realIdx, 1);
        saveChecklist(panel.id, full);
        rebuild();
      });

      li.append(grip, cb, span, del);
      list.appendChild(li);

      if (showDrag) attachItemDrag(li, list, idx,
        () => loadChecklist(panel.id),
        items => saveChecklist(panel.id, items),
        rebuild
      );
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
  return { rebuild };
}

// ── Static panels ─────────────────────────────────────────────

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
      const cfg = loadPanelCfg(panel.id, panel.defaultCfg);
      const displayItems = getDisplayItems(panel.id, items, cfg);
      const showDrag = cfg.mode !== 'random';

      const list = document.createElement('ul');
      list.className = 'static-list' + (hasTags ? ' has-tags' : '');
      if (cfg.mode === 'scroll') {
        list.style.maxHeight = '220px';
        list.style.overflowY = 'auto';
      }

      displayItems.forEach((item, idx) => {
        const li = document.createElement('li');
        li.dataset.idx = idx;

        const grip = document.createElement('span');
        grip.className = 'item-grip';
        grip.textContent = '⠿';
        if (!showDrag) grip.style.display = 'none';

        const textNode = document.createElement('span');
        textNode.className = 'static-text';
        textNode.textContent = item.text;

        li.append(grip, textNode);

        if (item.tag) {
          const tagEl = document.createElement('span');
          tagEl.className = 'tag tag-' + item.tag;
          tagEl.textContent = item.tag;
          li.appendChild(tagEl);
        }
        list.appendChild(li);

        if (showDrag) attachItemDrag(li, list, idx,
          () => loadStaticItems(panel),
          items => saveStaticItems(panel.id, items),
          rebuild
        );
      });

      wrapper.appendChild(list);
    } else {
      const editList = document.createElement('div');
      editList.className = 'edit-list';

      const TAG_CYCLE = ['daily', 'weekly', 'anytime', null];

      items.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'edit-row';
        row.dataset.idx = idx;

        // Top line: grip + input + delete
        const topLine = document.createElement('div');
        topLine.className = 'edit-row-top';

        const grip = document.createElement('span');
        grip.className = 'item-grip';
        grip.textContent = '⠿';

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = item.text;
        textInput.className = 'edit-text-input';
        textInput.addEventListener('blur', () => {
          const val = textInput.value.trim();
          if (val) { items[idx].text = val; saveStaticItems(panel.id, items); }
        });
        textInput.addEventListener('keydown', e => { if (e.key === 'Enter') textInput.blur(); });

        const del = document.createElement('button');
        del.className = 'static-del';
        del.textContent = '×';
        del.addEventListener('click', () => {
          items.splice(idx, 1);
          saveStaticItems(panel.id, items);
          rebuild();
        });

        topLine.append(grip, textInput, del);
        row.appendChild(topLine);

        // Bottom line: tag pill (only for tagged panels)
        if (hasTags) {
          const metaLine = document.createElement('div');
          metaLine.className = 'edit-row-meta';

          const tagBtn = document.createElement('button');
          const currentTag = item.tag || null;
          tagBtn.className = 'tag-cycle-btn' + (currentTag ? ' tag-' + currentTag : ' tag-none');
          tagBtn.textContent = currentTag ? currentTag : '+ tag';
          tagBtn.addEventListener('click', () => {
            const next = TAG_CYCLE[(TAG_CYCLE.indexOf(item.tag) + 1) % TAG_CYCLE.length];
            items[idx].tag = next;
            saveStaticItems(panel.id, items);
            rebuild();
          });

          metaLine.appendChild(tagBtn);
          row.appendChild(metaLine);
        }

        editList.appendChild(row);

        attachItemDrag(row, editList, idx,
          () => loadStaticItems(panel),
          items => saveStaticItems(panel.id, items),
          rebuild
        );
      });

      const addRow = document.createElement('div');
      addRow.className = 'add-row';
      const newInput = document.createElement('input');
      newInput.type = 'text';
      newInput.placeholder = 'Add item…';

      let newTag = hasTags ? 'daily' : null;
      addRow.appendChild(newInput);

      if (hasTags) {
        const newTagBtn = document.createElement('button');
        newTagBtn.className = 'tag-cycle-btn tag-daily';
        newTagBtn.textContent = 'daily';
        newTagBtn.addEventListener('click', e => {
          e.preventDefault();
          const cycle = ['daily', 'weekly', 'anytime'];
          newTag = cycle[(cycle.indexOf(newTag) + 1) % cycle.length];
          newTagBtn.className = 'tag-cycle-btn tag-' + newTag;
          newTagBtn.textContent = newTag;
        });
        addRow.appendChild(newTagBtn);
      }

      const addBtn = document.createElement('button');
      addBtn.textContent = 'Add';
      addRow.appendChild(addBtn);

      function addItem() {
        const text = newInput.value.trim();
        if (!text) return;
        items.push({ text, tag: newTag });
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
    rebuild,
    toggleEdit() {
      editMode = !editMode;
      rebuild();
      return editMode;
    }
  };
}

// ── Panel builder ─────────────────────────────────────────────

function loadUserPanels() {
  try { return JSON.parse(localStorage.getItem('user_panels')) || []; }
  catch { return []; }
}

function saveUserPanels(panels) {
  localStorage.setItem('user_panels', JSON.stringify(panels));
}

function allPanels() {
  return [...PANELS, ...loadUserPanels()];
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
  const all = allPanels();
  const order = loadOrder();
  if (!order) return all;
  return [
    ...order.map(id => all.find(p => p.id === id)).filter(Boolean),
    ...all.filter(p => !order.includes(p.id))
  ];
}

function buildSettingsBar(panelId, onchange, defaults) {
  const bar = document.createElement('div');
  bar.className = 'settings-bar';

  const cfg = loadPanelCfg(panelId, defaults);

  // Mode buttons
  const modeRow = document.createElement('div');
  modeRow.className = 'settings-modes';

  const modes = [['all','All'], ['first','First'], ['random','Random'], ['scroll','Scroll']];
  modes.forEach(([val, label]) => {
    const btn = document.createElement('button');
    btn.className = 'mode-btn' + (cfg.mode === val ? ' active' : '');
    btn.textContent = label;
    btn.dataset.mode = val;
    btn.addEventListener('click', () => {
      const c = loadPanelCfg(panelId, defaults);
      c.mode = val;
      savePanelCfg(panelId, c);
      bar.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === val));
      limitRow.style.display = (val === 'first' || val === 'random') ? 'flex' : 'none';
      _randomCache.delete(panelId);
      onchange();
    });
    modeRow.appendChild(btn);
  });

  // Limit stepper
  const limitRow = document.createElement('div');
  limitRow.className = 'settings-limit';
  limitRow.style.display = (cfg.mode === 'first' || cfg.mode === 'random') ? 'flex' : 'none';

  const dec = document.createElement('button');
  dec.className = 'stepper-btn';
  dec.textContent = '−';

  const valInput = document.createElement('input');
  valInput.type = 'text';
  valInput.className = 'stepper-val';
  valInput.value = cfg.limit;
  valInput.addEventListener('keydown', e => { if (e.key === 'Enter') valInput.blur(); });
  valInput.addEventListener('blur', () => {
    const parsed = parseInt(valInput.value, 10);
    if (isNaN(parsed) || parsed < 1) { valInput.value = loadPanelCfg(panelId, defaults).limit; return; }
    const c = loadPanelCfg(panelId, defaults);
    c.limit = parsed;
    savePanelCfg(panelId, c);
    valInput.value = c.limit;
    _randomCache.delete(panelId);
    onchange();
  });

  const inc = document.createElement('button');
  inc.className = 'stepper-btn';
  inc.textContent = '+';

  const lbl = document.createElement('span');
  lbl.className = 'stepper-lbl';
  lbl.textContent = 'items';

  dec.addEventListener('click', () => {
    const c = loadPanelCfg(panelId, defaults);
    c.limit = Math.max(1, c.limit - 1);
    savePanelCfg(panelId, c);
    valInput.value = c.limit;
    _randomCache.delete(panelId);
    onchange();
  });
  inc.addEventListener('click', () => {
    const c = loadPanelCfg(panelId, defaults);
    c.limit = c.limit + 1;
    savePanelCfg(panelId, c);
    valInput.value = c.limit;
    _randomCache.delete(panelId);
    onchange();
  });

  limitRow.append(dec, valInput, inc, lbl);
  bar.append(modeRow, limitRow);
  return bar;
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

  // ⚙ settings toggle button
  const cfgBtn = document.createElement('button');
  cfgBtn.className = 'edit-toggle-btn cfg-btn';
  cfgBtn.textContent = '⚙';
  cfgBtn.title = 'Display settings';

  title.append(grip, label);

  const contentEl = document.createElement('div');
  contentEl.className = 'panel-content';

  let panelRebuild;

  if (panel.type === 'checklist') {
    ({ rebuild: panelRebuild } = renderChecklist(panel, contentEl));
  } else {
    const { toggleEdit, rebuild } = renderStatic(panel, contentEl);
    panelRebuild = rebuild;
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

  // Delete button for user-created panels
  if (panel.userCreated) {
    const delBtn = document.createElement('button');
    delBtn.className = 'edit-toggle-btn panel-del-btn';
    delBtn.textContent = '×';
    delBtn.title = 'Delete panel';
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (!confirm(`Delete "${panel.title}"?`)) return;
      const updated = loadUserPanels().filter(p => p.id !== panel.id);
      saveUserPanels(updated);
      el.remove();
      saveOrder();
    });
    title.appendChild(delBtn);
  }

  title.appendChild(cfgBtn);

  const settingsBar = buildSettingsBar(panel.id, panelRebuild, panel.defaultCfg);
  settingsBar.style.display = 'none';

  el.append(title, settingsBar, contentEl);

  cfgBtn.addEventListener('click', e => {
    e.stopPropagation();
    const open = settingsBar.style.display === 'none';
    settingsBar.style.display = open ? 'flex' : 'none';
    cfgBtn.classList.toggle('active', open);
  });

  return el;
}

// ── Add Panel card ─────────────────────────────────────────────

function buildAddPanelCard() {
  const card = document.createElement('div');
  card.className = 'panel add-panel-card';
  card.id = 'add-panel-card';

  function showPrompt() {
    card.innerHTML = '';
    card.classList.add('add-panel-open');

    const form = document.createElement('div');
    form.className = 'add-panel-form';

    // Name
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Panel name…';
    nameInput.className = 'add-panel-input';

    // Type
    const typeRow = document.createElement('div');
    typeRow.className = 'add-panel-row';
    const typeLabel = document.createElement('span');
    typeLabel.textContent = 'Type';
    const typeSelect = document.createElement('select');
    typeSelect.className = 'tag-select';
    ['checklist', 'static'].forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      typeSelect.appendChild(opt);
    });
    typeRow.append(typeLabel, typeSelect);

    // Tags toggle (only relevant for static)
    const tagsRow = document.createElement('div');
    tagsRow.className = 'add-panel-row';
    const tagsLabel = document.createElement('span');
    tagsLabel.textContent = 'Has tags';
    const tagsCheck = document.createElement('input');
    tagsCheck.type = 'checkbox';
    tagsRow.append(tagsLabel, tagsCheck);

    typeSelect.addEventListener('change', () => {
      tagsRow.style.display = typeSelect.value === 'static' ? 'flex' : 'none';
    });
    tagsRow.style.display = 'none';

    // Buttons
    const btnRow = document.createElement('div');
    btnRow.className = 'add-panel-row add-panel-btns';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'clear-btn';
    cancelBtn.addEventListener('click', e => { e.stopPropagation(); showIdle(); });

    const createBtn = document.createElement('button');
    createBtn.textContent = 'Create';
    createBtn.className = 'edit-toggle-btn';
    createBtn.style.color = 'var(--accent)';
    createBtn.style.borderColor = 'var(--accent)';

    createBtn.addEventListener('click', e => {
      e.stopPropagation();
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); return; }

      const id = 'user_' + name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
      const panel = {
        id,
        title: name,
        type: typeSelect.value,
        items: tagsCheck.checked
          ? [{ text: 'Example item', tag: 'daily' }]
          : [],
        userCreated: true,
        hasTags: tagsCheck.checked
      };

      const userPanels = loadUserPanels();
      userPanels.push(panel);
      saveUserPanels(userPanels);

      const newEl = buildPanel(panel);
      initDrag(newEl);
      board.insertBefore(newEl, card);
      saveOrder();
      showIdle();
    });

    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') createBtn.click(); });

    btnRow.append(cancelBtn, createBtn);
    form.append(nameInput, typeRow, tagsRow, btnRow);
    card.appendChild(form);
    nameInput.focus();
  }

  function showIdle() {
    card.innerHTML = '';
    card.classList.remove('add-panel-open');
    const inner = document.createElement('div');
    inner.className = 'add-panel-idle';
    inner.innerHTML = '<span class="add-panel-plus">+</span><span>Add Panel</span>';
    card.appendChild(inner);
    card.addEventListener('click', showPrompt, { once: true });
  }

  showIdle();
  return card;
}

// ── Panel-level drag ──────────────────────────────────────────

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
    if (e.target.closest('.edit-toggle-btn, .cfg-btn')) return;
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
    if (e.target.closest('.edit-toggle-btn, .cfg-btn')) return;
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

board.appendChild(buildAddPanelCard());
