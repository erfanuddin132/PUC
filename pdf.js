// Fields that are saved locally when "Remember my info" is checked.
// These are the fields that stay the same across every assignment.
const REMEMBERED_FIELDS = [
    'department', 'stdName', 'stdId', 'stdSemester',
    'stdBatch', 'stdSession', 'stdSection'
];
const STORAGE_KEY_INFO = 'puc_remembered_info';
const STORAGE_KEY_THEME = 'puc_theme';
const STORAGE_KEY_HISTORY = 'puc_history';
const HISTORY_LIMIT = 10;

// Dynamically set logo image on load
document.addEventListener("DOMContentLoaded", function() {
    const logoImg = document.getElementById('pu-logo');
    if (logoImg) {
        // Set local download.jpg as image source
        logoImg.src = "download.jpg";
    }
    applySavedTheme();
    loadRememberedInfo();
    registerServiceWorker();
});

// Registers sw.js so offline caching / PWA install actually works.
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .catch(function(err) {
                console.error('Service worker registration failed:', err);
            });
    }
}

// Converts a native date input value (YYYY-MM-DD) to DD/MM/YYYY for display.
// Leaves the value untouched if it isn't in that format.
function formatDateForDisplay(value) {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length !== 3) return value;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
}

let currentType = 'assignment';

// Reads the saved theme (or system preference) and applies it to <html>.
function applySavedTheme() {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    setTheme(theme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.innerText = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
}

// Fills form fields with previously saved values, if any exist.
function loadRememberedInfo() {
    const raw = localStorage.getItem(STORAGE_KEY_INFO);
    if (!raw) return;

    const saved = JSON.parse(raw);
    REMEMBERED_FIELDS.forEach(function(id) {
        const el = document.getElementById(id);
        if (el && saved[id] !== undefined) {
            el.value = saved[id];
        }
    });
}

// Saves the remembered fields to localStorage, only if the checkbox is checked.
function saveRememberedInfo() {
    const checkbox = document.getElementById('rememberInfo');
    if (!checkbox || !checkbox.checked) return;

    const data = {};
    REMEMBERED_FIELDS.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) data[id] = el.value;
    });
    localStorage.setItem(STORAGE_KEY_INFO, JSON.stringify(data));
}

// Collects every input field's current value into a plain object.
function collectFormData() {
    const ids = [
        'department', 'customTitle', 'courseName', 'courseCode',
        'docNum', 'docName', 'datePerf', 'dateSub', 'submittedTo',
        'stdName', 'stdId', 'stdSemester', 'stdBatch', 'stdSession', 'stdSection'
    ];
    const data = { currentType: currentType };
    ids.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) data[id] = el.value;
    });
    return data;
}

// Downloads the current form data as a JSON file.
function exportData() {
    const data = collectFormData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'puc_cover_data.json';
    link.click();

    URL.revokeObjectURL(url);
}

// Reads a JSON file chosen via the file input and fills the form with it.
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        let data;
        try {
            data = JSON.parse(e.target.result);
        } catch (err) {
            alert('Invalid data file.');
            return;
        }

        // Move to the correct form screen and field labels first.
        selectType(data.currentType || 'assignment');

        Object.keys(data).forEach(function(id) {
            const el = document.getElementById(id);
            if (el && id !== 'currentType') {
                el.value = data[id];
            }
        });
    };
    reader.readAsText(file);

    // Reset the input so the same file can be re-imported later if needed.
    event.target.value = '';
}

// Saves the current form data as a history entry (max HISTORY_LIMIT, newest first).
function saveToHistory() {
    const data = collectFormData();
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY)) || [];
    } catch (err) {
        history = [];
    }

    history.unshift({
        savedAt: Date.now(),
        data: data
    });

    if (history.length > HISTORY_LIMIT) {
        history = history.slice(0, HISTORY_LIMIT);
    }

    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
}

function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY)) || [];
    } catch (err) {
        return [];
    }
}

function showHistory() {
    document.getElementById('selection-screen').classList.add('hidden');
    document.getElementById('history-screen').classList.remove('hidden');
    renderHistoryList();
}

function hideHistory() {
    document.getElementById('history-screen').classList.add('hidden');
    document.getElementById('selection-screen').classList.remove('hidden');
}

function renderHistoryList() {
    const container = document.getElementById('history-list');
    const history = getHistory();

    if (history.length === 0) {
        container.innerHTML = '<p class="history-empty">No saved reports yet.</p>';
        return;
    }

    container.innerHTML = history.map(function(entry, index) {
        const d = entry.data || {};
        const savedDate = new Date(entry.savedAt);
        const savedLabel = savedDate.toLocaleDateString() + ' ' + savedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const title = d.docName || d.customTitle || '(untitled)';
        const subtitle = [d.courseCode, d.courseName].filter(Boolean).join(' \u2013 ');

        return `
            <div class="history-item">
                <div class="history-item-info">
                    <div class="history-item-title">${escapeHtml(title)}</div>
                    <div class="history-item-subtitle">${escapeHtml(subtitle)}</div>
                    <div class="history-item-date">Saved: ${escapeHtml(savedLabel)}</div>
                </div>
                <button type="button" class="history-load-btn" onclick="loadHistoryItem(${index})">Load</button>
            </div>
        `;
    }).join('');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.innerText = str == null ? '' : str;
    return div.innerHTML;
}

function loadHistoryItem(index) {
    const history = getHistory();
    const entry = history[index];
    if (!entry) return;

    const data = entry.data;
    selectType(data.currentType || 'assignment');

    Object.keys(data).forEach(function(id) {
        const el = document.getElementById(id);
        if (el && id !== 'currentType') {
            el.value = data[id];
        }
    });

    document.getElementById('history-screen').classList.add('hidden');
    document.getElementById('form-screen').classList.remove('hidden');
}

function clearHistory() {
    if (!confirm('Clear all saved report history? This cannot be undone.')) return;
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    renderHistoryList();
}

// Shrinks the A4 preview to fit the current screen width. The exported
// #pdf-template node itself is never touched -- only its wrapper is
// scaled -- so PDF export always happens at full, real-world size.
function applyPreviewScale() {
    const page = document.getElementById('pdf-template');
    const inner = document.getElementById('preview-scale-inner');
    const outer = document.getElementById('preview-scroll-wrapper');
    if (!page || !inner || !outer) return;

    const availableWidth = outer.clientWidth - 16; // small side margin
    const naturalWidth = page.offsetWidth;
    const naturalHeight = page.offsetHeight;
    if (!naturalWidth) return;

    const scale = Math.min(1, availableWidth / naturalWidth);
    document.documentElement.style.setProperty('--preview-scale', scale);
    outer.style.height = (naturalHeight * scale) + 'px';
}

window.addEventListener('resize', applyPreviewScale);
window.addEventListener('orientationchange', applyPreviewScale);

function selectType(type) {
    currentType = type;
    document.getElementById('selection-screen').classList.add('hidden');
    document.getElementById('form-screen').classList.remove('hidden');

    const lblNum = document.getElementById('lbl-num');
    const lblName = document.getElementById('lbl-name');
    const outLblNum = document.getElementById('out-lbl-num');
    const outLblName = document.getElementById('out-lbl-name');
    const outMainTitle = document.getElementById('out-main-title');
    const customTitleGroup = document.getElementById('custom-title-group');

    if (type === 'assignment') {
        document.getElementById('form-title').innerText = 'Assignment Details';
        lblNum.innerText = 'Assignment No.:';
        lblName.innerText = 'Assignment Name:';
        
        outLblNum.innerText = 'Assignment No.';
        outLblName.innerText = 'Assignment Name';
        outMainTitle.innerText = 'ASSIGNMENT';
        
        // Hide custom title input for standard assignment
        customTitleGroup.classList.add('hidden');
        document.getElementById('customTitle').removeAttribute('required');
    } else if (type === 'lab') {
        document.getElementById('form-title').innerText = 'Lab Report Details';
        lblNum.innerText = 'Number of Report:';
        lblName.innerText = 'Name of Report:';
        
        outLblNum.innerText = 'Number of Report';
        outLblName.innerText = 'Name of Report';
        outMainTitle.innerText = 'LAB REPORT';
        
        // Hide custom title input for standard lab report
        customTitleGroup.classList.add('hidden');
        document.getElementById('customTitle').removeAttribute('required');
    } else if (type === 'custom') {
        document.getElementById('form-title').innerText = 'Custom Cover Details';
        lblNum.innerText = 'Document No / ID:';
        lblName.innerText = 'Document Sub-Title:';
        
        outLblNum.innerText = 'Document No / ID';
        outLblName.innerText = 'Document Sub-Title';
        
        // Show custom title input for custom cover
        customTitleGroup.classList.remove('hidden');
        document.getElementById('customTitle').setAttribute('required', 'true');
    }
}

function goBack() {
    document.getElementById('form-screen').classList.add('hidden');
    document.getElementById('selection-screen').classList.remove('hidden');
}

function backToForm() {
    document.getElementById('preview-screen').classList.add('hidden');
    document.getElementById('form-screen').classList.remove('hidden');
}

function generatePreview() {
    // Problem 2: Set Dynamic Department from Dropdown
    const deptSelect = document.getElementById('department');
    const selectedDeptText = deptSelect.options[deptSelect.selectedIndex].text;
    
    // Set department value in output box (taking text or value as you prefer)
    document.getElementById('out-dept').innerText = deptSelect.value;

    // Set other form inputs
    document.getElementById('out-courseName').innerText = document.getElementById('courseName').value;
    document.getElementById('out-courseCode').innerText = document.getElementById('courseCode').value;
    document.getElementById('out-docNum').innerText = document.getElementById('docNum').value;
    document.getElementById('out-docName').innerText = document.getElementById('docName').value;
    document.getElementById('out-datePerf').innerText = formatDateForDisplay(document.getElementById('datePerf').value);
    document.getElementById('out-dateSub').innerText = formatDateForDisplay(document.getElementById('dateSub').value);
    document.getElementById('out-submittedTo').innerText = document.getElementById('submittedTo').value;
    
    document.getElementById('out-stdName').innerText = document.getElementById('stdName').value;
    document.getElementById('out-stdId').innerText = document.getElementById('stdId').value;
    document.getElementById('out-stdSemester').innerText = document.getElementById('stdSemester').value;
    document.getElementById('out-stdBatch').innerText = document.getElementById('stdBatch').value;
    document.getElementById('out-stdSession').innerText = document.getElementById('stdSession').value;
    document.getElementById('out-stdSection').innerText = document.getElementById('stdSection').value;

    // Problem 1: Handle Custom Cover Title Output
    if (currentType === 'custom') {
        const customTitleVal = document.getElementById('customTitle').value;
        document.getElementById('out-main-title').innerText = customTitleVal ? customTitleVal.toUpperCase() : 'CUSTOM COVER';
    }

    saveRememberedInfo();

    document.getElementById('form-screen').classList.add('hidden');
    document.getElementById('preview-screen').classList.remove('hidden');
    // A small delay ensures the element is visible (not display:none)
    // before we measure it for scaling.
    setTimeout(applyPreviewScale, 0);
}

function savePDF() {
    saveToHistory();

    const element = document.getElementById('pdf-template');
    
    let filename = 'Assignment_Cover_Page.pdf';
    if (currentType === 'lab') {
        filename = 'Lab_Report_Cover_Page.pdf';
    } else if (currentType === 'custom') {
        const customTitleVal = document.getElementById('customTitle').value;
        filename = customTitleVal ? `${customTitleVal.replace(/\s+/g, '_')}_Cover_Page.pdf` : 'Custom_Cover_Page.pdf';
    }

    const opt = {
        margin:       0,
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
}