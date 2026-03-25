// ============================================================
//  PANEL CONFIG
//  Edit this section to add, remove, or reorder panels.
//
//  type: "checklist" — items live in localStorage, can add/check/delete
//  type: "static"    — permanent list, edit items[] here in this config
//
//  For static panels each item can be a plain string:
//    "Do the thing"
//  Or an object with an optional tag:
//    { text: "Do the thing", tag: "daily" }   (tags: daily | weekly | anytime)
// ============================================================
const PANELS = [
  {
    id: "programming",
    title: "Programming To-Do",
    type: "checklist",
    items: [
      "Add VS Code Codex voice commands",
      "Add icon library Stream Deck voice commands",
      "Modify stream decks more programmatically",
      "Fix AHK++ VSCode extension not loading on boot",
      "Build custom Chrome new tab page"
    ]
  },
  {
    id: "house",
    title: "House To-Do",
    type: "checklist",
    items: [
      "Stabilise washing machine",
      "Plant fruit trees",
      "Clean room",
      "Fix car windshield",
      "Set up binder"
    ]
  },
  {
    id: "rotation",
    title: "Rotation",
    type: "static",
    items: [
      { text: "Review programming to-do list",  tag: "daily"   },
      { text: "Clear email inbox",               tag: "daily"   },
      { text: "Check on any open projects",      tag: "daily"   },
      { text: "Tidy desk / workspace",           tag: "weekly"  },
      { text: "Review notes & scratch files",    tag: "weekly"  },
      { text: "Back up important files",         tag: "weekly"  },
      { text: "Go outside for a walk",           tag: "anytime" },
      { text: "Watch something you've queued",   tag: "anytime" },
      { text: "Read for 20 minutes",             tag: "anytime" }
    ]
  },
  {
    id: "brain",
    title: "Brain / Productivity",
    type: "static",
    items: [
      "If stuck on something, take a break and come back",
      "Break big tasks into the smallest next action",
      "Close unneeded browser tabs before starting work",
      "Write down anything floating in your head",
      "Timebox: 25 min focused work, 5 min break",
      "If overwhelmed, pick just ONE thing to do next"
    ]
  }
];
// ============================================================
//  END CONFIG — logic below, no need to edit
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

const board = document.getElementById('board');
for (const panel of PANELS) {
  const el = document.createElement('div');
  el.className = 'panel';

  const title = document.createElement('div');
  title.className = 'panel-title';
  title.textContent = panel.title;
  el.appendChild(title);

  if (panel.type === 'checklist') renderChecklist(panel, el);
  else renderStatic(panel, el);

  board.appendChild(el);
}
