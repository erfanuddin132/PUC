// Dynamically set logo image on load
document.addEventListener("DOMContentLoaded", function() {
    const logoImg = document.getElementById('pu-logo');
    if (logoImg) {
        // Set local download.jpg as image source
        logoImg.src = "download.jpg";
    }
});

let currentType = 'assignment';

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
    document.getElementById('out-datePerf').innerText = document.getElementById('datePerf').value;
    document.getElementById('out-dateSub').innerText = document.getElementById('dateSub').value;
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

    document.getElementById('form-screen').classList.add('hidden');
    document.getElementById('preview-screen').classList.remove('hidden');
}

function savePDF() {
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