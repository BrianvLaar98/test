
// Initialize descriptors, variants, and cross-impact matrix
let descriptors = [];
let variants = {};
let cibMatrix = [];
let consistentScenarios = [];

// File handling for project save/load
function saveProject() {
  const projectData = { descriptors, variants, cibMatrix };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "project.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function loadProject() {
  document.getElementById('fileInput').click();
}

function handleFile(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const projectData = JSON.parse(e.target.result);
    descriptors = projectData.descriptors;
    variants = projectData.variants;
    cibMatrix = projectData.cibMatrix || [];
    updateDescriptorList();
    generateCIBMatrix();
  };
  reader.readAsText(file);
}

// Descriptor and Variant Management
function addDescriptor() {
  const descriptorInput = document.getElementById('descriptorInput').value;
  if (descriptorInput) {
    descriptors.push(descriptorInput);
    variants[descriptorInput] = [];
    document.getElementById('descriptorInput').value = '';
    updateDescriptorList();
    updateDescriptorSelect();
    generateCIBMatrix();
  }
}

function updateDescriptorList() {
  const list = document.getElementById('descriptorList');
  list.innerHTML = '';
  descriptors.forEach(desc => {
    const listItem = document.createElement('li');
    listItem.textContent = `${desc} - Variants: ${variants[desc].join(", ")}`;
    list.appendChild(listItem);
  });
}

function updateDescriptorSelect() {
  const select = document.getElementById('descriptorSelect');
  select.innerHTML = '';
  descriptors.forEach(desc => {
    const option = document.createElement('option');
    option.value = desc;
    option.textContent = desc;
    select.appendChild(option);
  });
}

function addVariant() {
  const descriptor = document.getElementById('descriptorSelect').value;
  const variant = document.getElementById('variantInput').value;
  if (descriptor && variant) {
    variants[descriptor].push(variant);
    document.getElementById('variantInput').value = '';
    updateDescriptorList(descriptor);
  }
}

// Toggle automatic variant generation
function toggleAutoGenerate() {
  const isChecked = document.getElementById('autoGenerateCheck').checked;
  document.getElementById('autoVariantContainer').style.display = isChecked ? 'block' : 'none';
}

function autoGenerateVariants() {
  const descriptor = document.getElementById('descriptorSelect').value;
  const minValue = parseFloat(document.getElementById('minValue').value);
  const maxValue = parseFloat(document.getElementById('maxValue').value);
  const numVariants = parseInt(document.getElementById('numVariants').value);

  if (descriptor && !isNaN(minValue) && !isNaN(maxValue) && numVariants > 0) {
    const step = (maxValue - minValue) / (numVariants - 1);
    variants[descriptor] = Array.from({ length: numVariants }, (_, i) => (minValue + i * step).toFixed(2));
    updateDescriptorList(descriptor);
  }
}

// Cross-Impact Matrix Input
function generateCIBMatrix() {
  cibMatrix = descriptors.map(() => Array(descriptors.length).fill(0));
  const matrixContainer = document.getElementById('cibMatrixContainer');
  matrixContainer.innerHTML = '';

  let matrixHtml = '<table><tr><th></th>';
  descriptors.forEach(desc => matrixHtml += `<th>${desc}</th>`);
  matrixHtml += '</tr>';

  descriptors.forEach((rowDesc, rowIndex) => {
    matrixHtml += `<tr><td>${rowDesc}</td>`;
    descriptors.forEach((colDesc, colIndex) => {
      if (rowIndex === colIndex) {
        matrixHtml += `<td>-</td>`;
      } else {
        matrixHtml += `<td><input type="number" id="cib_${rowIndex}_${colIndex}" value="0" min="-3" max="3"></td>`;
      }
    });
    matrixHtml += '</tr>';
  });
  matrixContainer.innerHTML = matrixHtml;
}

function generateConsistentScenarios() {
  descriptors.forEach((_, i) => {
    descriptors.forEach((_, j) => {
      if (i !== j) {
        cibMatrix[i][j] = parseInt(document.getElementById(`cib_${i}_${j}`).value);
      }
    });
  });
  consistentScenarios = findConsistentScenarios(cibMatrix);
  generateScenarioTableau(consistentScenarios);
}

function findConsistentScenarios(matrix) {
  return [
    [{ name: "Descriptor A", variant: "Variant 1" }, { name: "Descriptor B", variant: "Variant 2" }],
    [{ name: "Descriptor A", variant: "Variant 2" }, { name: "Descriptor B", variant: "Variant 3" }]
  ];
}

function generateScenarioTableau(scenarios) {
  const tableau = document.getElementById("scenarioTableau");
  tableau.innerHTML = ""; // Clear previous tableau

  scenarios.forEach((scenario, index) => {
    const scenarioDiv = document.createElement("div");
    scenarioDiv.className = "scenario";

    const title = document.createElement("h3");
    title.textContent = `Scenario ${index + 1}`;
    scenarioDiv.appendChild(title);

    scenario.forEach((descriptor) => {
      const descriptorDiv = document.createElement("div");
      descriptorDiv.className = "descriptor";
      descriptorDiv.textContent = `Descriptor: ${descriptor.name}`;
      
      const variantDiv = document.createElement("div");
      variantDiv.className = "variant";
      variantDiv.textContent = `Variant: ${descriptor.variant}`;
      
      descriptorDiv.appendChild(variantDiv);
      scenarioDiv.appendChild(descriptorDiv);
    });

    tableau.appendChild(scenarioDiv);
  });
}

// TOPSIS Ranking based on the variant ranges for consistent scenarios
function calculateTopsis() {
  const idealBest = [];
  const idealWorst = [];
  const scenarioScores = [];

  // Extract variant values for each consistent scenario and find ideal best and worst for TOPSIS
  consistentScenarios.forEach((scenario) => {
    scenarioScores.push(scenario.map(descriptor => parseFloat(descriptor.variant)));
  });

  // Calculate ideal best and worst
  scenarioScores[0].forEach((_, index) => {
    idealBest.push(Math.max(...scenarioScores.map(score => score[index])));
    idealWorst.push(Math.min(...scenarioScores.map(score => score[index])));
  });

  const distances = scenarioScores.map(scores => {
    const distanceBest = Math.sqrt(scores.reduce((acc, score, i) => acc + Math.pow(score - idealBest[i], 2), 0));
    const distanceWorst = Math.sqrt(scores.reduce((acc, score, i) => acc + Math.pow(score - idealWorst[i], 2), 0));
    return distanceWorst / (distanceBest + distanceWorst);
  });

  const rankings = distances.map((score, i) => ({ scenario: `Scenario ${i + 1}`, score }));
  rankings.sort((a, b) => b.score - a.score);

  let resultHtml = "TOPSIS Ranking:<ul>";
  rankings.forEach(ranking => resultHtml += `<li>${ranking.scenario}: ${ranking.score.toFixed(2)}</li>`);
  resultHtml += "</ul>";
  document.getElementById('topsisResult').innerHTML = resultHtml;
}
