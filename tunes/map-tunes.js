/*! *****************************************************************************
Copyright (c) 2024 Mick Phillips. All rights reserved.

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.
*/

const KEYS = {
  'selected' : 'selectedCatalogIds',
  'navigation': 'navigation',
  'inputQueryTemplate' : 'data-query-template',
  'queryPlaceholder': '$QVAL',
}


const PAGINATION_LIMIT = 5;

function includeNavigation () {
  var navContainer = document.getElementById(KEYS.navigation);
  fetch(`${ document.baseURI }/nav`).then( res => res.text())
               .then( txt => { navContainer.innerHTML = txt; });
}

/* Database wrapper */

async function fetchDatabase(refresh=false) {
  const headers = refresh ? {'Cache-Control':'no-store, no-cache' } : {};
  const sqlPromise = initSqlJs({ locateFile: file => `${ document.baseURI }/scripts/${file}` });
  const dataPromise = fetch(`${ document.baseURI }/tunes.db`, { 'headers' :headers} ).then(res => res.arrayBuffer());
  const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
  const db = new SQL.Database(new Uint8Array(buf));
  return db;
}

/* Selection handling */

const session = {

  get selected() {
    return window.sessionStorage.getItem(KEYS.selected)?.split(',') ?? [];
  }, 

  set selected(ids) {
    const storage = window.sessionStorage;
    (ids ?? []).length > 0 ? storage.setItem(KEYS.selected, ids) : storage.removeItem(KEYS.selected);
  },

  addToSelection: function(ids) {
    const _selection = this.selected;
    (ids ?? []).forEach( id => _selection.includes(id) ? null : _selection.push(id));
    this.selected = _selection;
  },

  removeFromSelection: function(ids) {
    const _selection = this.selected;
    ids.forEach( id => _selection.splice(_selection.indexOf(id), 1));
    this.selected = _selection;
  },

  updateSelectionFromUrl() {
    const params = new URLSearchParams(location.search);
    this.addToSelection(params.get('selected')?.split(','));
  },
};

/* Tune book rendering */

function parseSelectionToWhereClause() {
  if (session.selected.length === 0) {
    return '';
  } else {
    return `WHERE id IN (${session.selected})`;
  }
}

async function renderTuneBook() {
  includeNavigation();
  var container = document.getElementById('tuneArea');
  const params = new URLSearchParams(location.search);
  const tuneId = params.get('tuneId')

  if (tuneId) {
    var query = await fetchDatabase().then(db => db.prepare(`SELECT * FROM tunes where id = ${tuneId}`));
  } else {
    var query = await fetchDatabase().then(db => db.prepare('SELECT * FROM tunes ' + parseSelectionToWhereClause()));
  }

  while (query.step()) {
    const abcDiv = document.createElement('abc-div');
    let t = query.getAsObject();
    abcDiv.setAttribute('id', t.id);
    abcDiv.innerText += t.abc
    container.appendChild(abcDiv);
  }
}

/* Catalog rendering */

function extractMeasures(abc, n) {
  var abcOutLines = new Array();
  const parsed = ABCJS.extractMeasures(abc);
  var abcOutLines = parsed[0].header.match(/^[XLMKQ]:.*/mg)
  abcOutLines.push(parsed[0].measures.slice(0, n).map(m => m.abc).join());
  return abcOutLines.join('\n');
}

function toggleSelected (change) {
  const id = change.target.value;
  change.target.checked ? session.addToSelection([id]) : session.removeFromSelection([id]);
}

function makeCheckbox (row, tune, selection)  {
  const checkbox = row.insertCell();
  const checked = selection.includes(tune.id.toString()) ? `checked` : ``;
  checkbox.innerHTML = (`<input type="checkbox" id="select${tune.id}" ` +
                        `name="select{tune.id}" value="${tune.id}"` +
                        `method="dialog"` +
                        checked +
                        `/>`);
  checkbox.addEventListener('change', toggleSelected)
}

function renderMeasures(row, tune) {
  const abcCell = row.insertCell();
  const abcDiv = document.createElement('div');
  abcCell.appendChild(abcDiv);
  const svgs = ABCJS.renderAbc(abcDiv, extractMeasures(tune.abc, 2), {
    'scale': 0.5,
    'staffwidth': 200,
    'add_classes': true,
    // 'showDebug': 'box',
    // 'responsive' : 'resize'
  })[0].engraver.svgs;
}

function defineColumn (label, contentFactory, query) {
  return {
    'label': label,
    'f': contentFactory,
    'query': query,
  };
}

const catalogCols = [
  defineColumn('', renderMeasures),
  defineColumn('', makeCheckbox),
  defineColumn(
    'Name',
    (row, t) => row.insertCell().innerHTML = `<a href=${ document.baseURI }/tunebook.html?tuneId=${t.id}>${t.title}</a>`,
    `search_title LIKE '$QVAL'`),
  defineColumn(
    'Credit',
    (row, t) => row.insertCell().innerText = `${t.composer} ${t.author}`,
    `(search_composer LIKE '$QVAL' OR AUTHOR LIKE '$QVAL')`),
  defineColumn(
    'Origin',
    (row, t) => row.insertCell().innerText = `${t.origin}`,
    `search_origin LIKE '$QVAL'`),
  defineColumn(
    'Style',
    (row, t) => row.insertCell().innerText = `${t.rhythm}`,
    `rhythm LIKE '$QVAL'`),
  defineColumn(
    'Collection/Book',
    (row, t) => row.insertCell().innerText = `${t.book}`,
    `book LIKE '$QVAL'`),
]


const catalogQuery = {
  from: 'FROM tunes',

  page: new URLSearchParams(location.search).get('page') ?? 0,

  _whereTerms: new Map(),

  get offset () {
    return this.page * PAGINATION_LIMIT;
  },

  get where () {
    if (this._whereTerms.size == 0) {
      return '';
    } else {
      return 'WHERE ' + (Array.from(this._whereTerms.values()).join(' AND '));
    }
  },

  get limit() {
    return `LIMIT ${PAGINATION_LIMIT} OFFSET ${this.offset}`;
  },

  get orderBy() {
    return `ORDER BY title ASC`;
  },

  get rowCount() {
    return fetchDatabase().then(db => db.exec('SELECT COUNT(id) FROM tunes')[0].values[0][0]);
  },

  get rows() {
    return fetchDatabase().then(db => db.prepare(`SELECT * ${this.from} ${this.where} ${this.orderBy} ${this.limit} `));
  },

  updateWhere: function(key, value) {
    if (value.length > 0) {
      this._whereTerms.set(key, value);
      this.page = 0;
    } else {
      this._whereTerms.delete(key);
    }
    console.log(this.where);
  },
}

async function onPaginationClick(event) {
  let rowCount = await catalogQuery.rowCount;
  let numPages = Math.floor(rowCount / PAGINATION_LIMIT) - (rowCount % PAGINATION_LIMIT === 0);
  switch (event.target.value) {
    case 'first':
      catalogQuery.page = 0;
      break;
    case 'prev':
      catalogQuery.page = Math.max(0, catalogQuery.page - 1);
      break;
    case 'next':
      catalogQuery.page = Math.min(numPages, catalogQuery.page + 1);
      break;
    case 'last':
      catalogQuery.page = numPages;
      break;
  }
  renderCatalogTableRows();
}

function canonizeString(s) {
    return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function onQueryInput(event) {
  const key = event.target.getAttribute('label');
  let queryStr = '';
  if (event.target.value.length > 0) {
    let value = `%${canonizeString(event.target.value)}%`;
    queryStr = event.target.getAttribute(KEYS.inputQueryTemplate).replaceAll(KEYS.queryPlaceholder, value);
  }
  catalogQuery.updateWhere(key, queryStr);
  renderCatalogTableRows();
}

function makeColumnHeader(columnDef, hasInput=false) {
  const th = document.createElement('th');
  th.innerHTML = `<div width="100%">${columnDef.label}</div>`;
  if (hasInput) {
    const button = document.createElement('input');
    button.setAttribute(`type`, "text");
    button.setAttribute(`label`, columnDef.label);
    button.readonly = false;
    button.setAttribute(KEYS.inputQueryTemplate, columnDef.query);
    button.addEventListener('change', onQueryInput);
    th.appendChild(button);
  }
  return th;
}

async function renderCatalogTableRows() {
  const tbody = document.querySelector('#catalog tbody');
  tbody.innerHTML = '';

  catalogQuery.rowCount.then(rowCount => {
    const status = document.querySelector('#tableStatus');
    let first = catalogQuery.offset + 1;
    let last = Math.min(rowCount, first + PAGINATION_LIMIT - 1);
    status.innerText = `${first} to ${last} of ${rowCount}`;
  });

  const records = await catalogQuery.rows;
  while (records.step()) {
    const row = tbody.insertRow();
    const t = records.getAsObject();
    catalogCols.forEach( (col) => col.f(row, t, session.selected) )
  }
}

async function renderCatalog() {
  document.querySelectorAll("#pagination input").forEach( b => b.addEventListener('click', onPaginationClick));
  session.updateSelectionFromUrl();
  includeNavigation();

  const container = document.getElementById("catalog");
  container.innerHTML = '';

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  catalogCols.forEach((col, i) => {
    thead.appendChild(makeColumnHeader(col, i > 1));
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);

  renderCatalogTableRows();
}