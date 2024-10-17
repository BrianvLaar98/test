
// Initialize descriptors, variants, and cross-impact matrix
let descriptors = [];
let variants = {};
let cibMatrix = [];
let tolerance = 0; // Tolerance for inconsistency

// Adding descriptor and ensuring descriptors list is updated correctly
function addDescriptor() {
    const descriptorInput = document.getElementById("descriptorInput").value.trim();
    if (descriptorInput && !descriptors.includes(descriptorInput)) {
        descriptors.push(descriptorInput);
        variants[descriptorInput] = [];
        document.getElementById("descriptorInput").value = "";
        updateDescriptorList();
        updateDescriptorSelect();
        generateCIBMatrix();  // Update matrix when a new descriptor is added
    } else {
        alert("Descriptor is either empty or already exists.");
    }
}

// Update the descriptors display list
function updateDescriptorList() {
    const list = document.getElementById("descriptorList");
    list.innerHTML = "";
    descriptors.forEach(desc => {
        const listItem = document.createElement("li");
        listItem.textContent = `${desc} - Variants: ${variants[desc].join(", ")}`;
        list.appendChild(listItem);
    });
}

// Populate the descriptor dropdown for adding variants
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

// Adding a variant and updating CIB matrix
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

// Generate a unified cross-impact matrix for all descriptor variants
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

// Generate consistent scenarios based on CIB method and display in tableau
function generateConsistentScenarios() {
    const consistentScenarios = [];
    const allVariants = [];

    // Collect all descriptor variants for evaluation
    descriptors.forEach(descriptor => {
        variants[descriptor].forEach(variant => {
            allVariants.push({ descriptor, variant });
        });
    });

    // Calculate consistency for each scenario based on CIB tolerance
    allVariants.forEach((variant, index) => {
        let isConsistent = true;
        const influenceSum = cibMatrix[index].reduce((sum, value) => sum + value, 0);

        if (Math.abs(influenceSum) > tolerance) {
            isConsistent = false;
        }

        if (isConsistent) {
            consistentScenarios.push(variant);
        }
    });

    // Display consistent scenarios in the scenario tableau
    let tableauHtml = "<h3>Consistent Scenario Tableau:</h3><div id='scenarioTableau'>";
    consistentScenarios.forEach((scenario, index) => {
        tableauHtml += `<div class='scenario'><h4>Scenario ${index + 1}</h4><p>${scenario.descriptor}: ${scenario.variant}</p></div>`;
    });
    tableauHtml += "</div>";

    document.getElementById("consistentScenariosResult").innerHTML = tableauHtml;
}

// Update tolerance from user input
function updateTolerance() {
    tolerance = parseFloat(document.getElementById("toleranceInput").value);
}

// Save and load project functions
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
