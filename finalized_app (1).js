
// Initialize descriptors, variants, and cross-impact matrix
let descriptors = [];
let variants = {};
let cibMatrix = [];

function addDescriptor() {
    const descriptorInput = document.getElementById("descriptorInput").value.trim();
    if (descriptorInput && !descriptors.includes(descriptorInput)) {
        descriptors.push(descriptorInput);
        variants[descriptorInput] = [];
        document.getElementById("descriptorInput").value = "";
        updateDescriptorList();
        updateDescriptorSelect();
        generateCIBMatrix();
    } else {
        alert("Descriptor is either empty or already exists.");
    }
}

function updateDescriptorList() {
    const list = document.getElementById("descriptorList");
    list.innerHTML = "";
    descriptors.forEach(desc => {
        const listItem = document.createElement("li");
        listItem.textContent = `${desc} - Variants: ${variants[desc].join(", ")}`;
        list.appendChild(listItem);
    });
}

function updateDescriptorSelect() {
    const select = document.getElementById("descriptorSelect");
    select.innerHTML = "";
    descriptors.forEach(desc => {
        const option = document.createElement("option");
        option.value = desc;
        option.textContent = desc;
        select.appendChild(option);
    });
}

function addVariant() {
    const descriptor = document.getElementById("descriptorSelect").value;
    const variantInput = document.getElementById("variantInput").value.trim();
    if (descriptor && variantInput && !variants[descriptor].includes(variantInput)) {
        variants[descriptor].push(variantInput);
        document.getElementById("variantInput").value = "";
        updateDescriptorList();
        generateCIBMatrix();
    } else {
        alert("Variant is either empty, already exists, or no descriptor selected.");
    }
}

function generateCIBMatrix() {
    cibMatrix = [];
    const allVariants = [];

    descriptors.forEach(descriptor => {
        variants[descriptor].forEach(variant => {
            allVariants.push({ descriptor, variant });
        });
    });

    cibMatrix = Array(allVariants.length).fill(null).map(() => Array(allVariants.length).fill(0));
    
    let matrixHtml = '<table><tr><th></th>';
    allVariants.forEach((_, colIndex) => {
        matrixHtml += `<th>${allVariants[colIndex].descriptor}: ${allVariants[colIndex].variant}</th>`;
    });
    matrixHtml += '</tr>';

    allVariants.forEach((rowVariant, rowIndex) => {
        matrixHtml += `<tr><td>${rowVariant.descriptor}: ${rowVariant.variant}</td>`;
        allVariants.forEach((colVariant, colIndex) => {
            if (rowVariant.descriptor === colVariant.descriptor) {
                matrixHtml += '<td>-</td>';
            } else {
                matrixHtml += `<td><input type="number" id="cib_${rowIndex}_${colIndex}" min="-3" max="3" step="1" value="0"></td>`;
            }
        });
        matrixHtml += '</tr>';
    });
    matrixHtml += '</table>';

    document.getElementById("cibMatrixContainer").innerHTML = matrixHtml;
}

function saveProject() {
    const projectData = { descriptors, variants, cibMatrix };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "project.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function loadProject() {
    document.getElementById("fileInput").click();
}

function handleFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        const projectData = JSON.parse(e.target.result);
        descriptors = projectData.descriptors;
        variants = projectData.variants;
        generateCIBMatrix();
    };
    reader.readAsText(file);
}

function calculateTopsis() {
    const idealBest = [];
    const idealWorst = [];
    const scenarioScores = [];

    cibMatrix.forEach((row, i) => {
        const score = row.reduce((acc, value) => acc + Math.abs(value), 0);
        scenarioScores.push({ scenario: `Variant ${i+1}`, score });
    });

    const sortedScores = scenarioScores.sort((a, b) => b.score - a.score);
    let resultHtml = "<h3>Scenario Ranking (TOPSIS)</h3><ul>";
    sortedScores.forEach(s => resultHtml += `<li>${s.scenario}: ${s.score}</li>`);
    resultHtml += "</ul>";
    document.getElementById("topsisResult").innerHTML = resultHtml;
}
