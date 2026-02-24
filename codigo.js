const times = ["13:10", "14:40", "16:30", "18:00", "19:30"];
const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

let storage = JSON.parse(localStorage.getItem('unigrade')) || {
    grid: {},
    subjects: {}
};

let currentActiveId = null;

function generateRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 60%)`;
}

function renderGrid() {
    const body = document.getElementById('schedule-body');
    body.innerHTML = '';

    times.forEach(t => {
        const row = document.createElement('tr');
        let cells = `<td class="time-header">${t}</td>`;
        
        days.forEach(d => {
            const id = `${d}-${t}`;
            const subName = storage.grid[id] || "";
            const subData = storage.subjects[subName];
            const colorStyle = subData ? `style="border-left: 5px solid ${subData.color}"` : "";
            
            cells += `
                <td class="slot" ${colorStyle} onclick="openPanel('${id}', '${d}', '${t}')">
                    <span class="sub-name">${subName}</span>
                    ${subData?.tasks.length ? `<span class="badge">${subData.tasks.length}</span>` : ''}
                </td>`;
        });
        row.innerHTML = cells;
        body.appendChild(row);
    });
    updateSelectors();
}

function updateSelectors() {
    const sel = document.getElementById('subject-selector');
    const list = Object.keys(storage.subjects);
    sel.innerHTML = '<option value="">-- Vago --</option>' + 
        list.map(s => `<option value="${s}">${s}</option>`).join('');
}

function createNewSubject() {
    const name = document.getElementById('new-subject-name').value.trim();
    if (name && !storage.subjects[name]) {
        storage.subjects[name] = { color: generateRandomColor(), tasks: [] };
        document.getElementById('new-subject-name').value = '';
        sync();
        renderManageList();
    }
}

function removeSubject(name) {
    delete storage.subjects[name];
    for (let k in storage.grid) if (storage.grid[k] === name) delete storage.grid[k];
    sync();
    renderManageList();
}

function renderManageList() {
    const list = document.getElementById('subjects-list-manage');
    list.innerHTML = Object.keys(storage.subjects).map(s => `
        <div class="subject-item-manage" style="border-left: 4px solid ${storage.subjects[s].color}">
            <span>${s}</span>
            <button onclick="removeSubject('${s}')" style="background:none; border:none; color:var(--danger); cursor:pointer;">✕</button>
        </div>
    `).join('');
}

function openPanel(id, day, time) {
    currentActiveId = id;
    const name = storage.grid[id] || "";
    document.getElementById('side-panel').classList.add('active');
    document.getElementById('panel-info').innerText = `${day} - ${time}`;
    document.getElementById('panel-subject-title').innerText = name || "Selecionar Aula";
    document.getElementById('subject-selector').value = name;

    const section = document.getElementById('content-section');
    if(name) {
        section.style.display = 'block';
        renderTasks(name);
    } else {
        section.style.display = 'none';
    }
}

function saveSlot() {
    const val = document.getElementById('subject-selector').value;
    storage.grid[currentActiveId] = val;
    sync();
    openPanel(currentActiveId, currentActiveId.split('-')[0], currentActiveId.split('-')[1]);
}

function addTask() {
    const sub = storage.grid[currentActiveId];
    const title = document.getElementById('task-title').value;
    const date = document.getElementById('task-date').value;
    if(!title || !date) return;

    storage.subjects[sub].tasks.push({ id: Date.now(), title, date });
    sync();
    renderTasks(sub);
    document.getElementById('task-title').value = '';
}

function renderTasks(name) {
    const container = document.getElementById('task-container');
    const tasks = storage.subjects[name].tasks.sort((a,b) => new Date(a.date) - new Date(b.date));
    container.innerHTML = tasks.map(t => `
        <div class="task-card" style="border-left-color: ${storage.subjects[name].color}">
            <div style="display:flex; justify-content:space-between">
                <strong>${t.title}</strong>
                <button onclick="removeTask('${name}', ${t.id})" style="border:none; background:none; color:var(--danger); cursor:pointer;">✕</button>
            </div>
            <small>Data: ${t.date.split('-').reverse().join('/')}</small>
        </div>
    `).join('') || '<p style="opacity:0.5; font-size:0.8rem;">Sem tarefas.</p>';
}

function removeTask(sub, id) {
    storage.subjects[sub].tasks = storage.subjects[sub].tasks.filter(t => t.id !== id);
    sync();
    renderTasks(sub);
}

function toggleSubjectModal() {
    const m = document.getElementById('subject-modal');
    m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
    if(m.style.display === 'flex') renderManageList();
}

function closePanel() { document.getElementById('side-panel').classList.remove('active'); }
function sync() { localStorage.setItem('unigrade', JSON.stringify(storage)); renderGrid(); }

renderGrid();