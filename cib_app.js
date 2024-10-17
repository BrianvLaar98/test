
// Initialize descriptors, variants, cross-impact matrix, and tolerance for consistency calculation
let descriptors = [];
let variants = {};
let cibMatrix = [];
let tolerance = 0;

// Function to add descriptors
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

// Update the descriptor list display
function updateDescriptorList() {
    const list = document.getElementById("descriptorList");
    list.innerHTML = "";
    descriptors.forEach(desc => {
        const listItem = document.createElement("li");
        listItem.textContent = `${desc} - Variants: ${variants[desc].join(", ")}`;
        list.appendChild(listItem);
    });
}

// Populate descriptor dropdown for adding variants
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

// Add variant and update CIB matrix
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

// Generate cross-impact matrix for descriptor variants
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

// Generate consistent scenarios based on CIB method
function generateConsistentScenarios() {
    const allVariants = [];
    const consistentScenarios = [];

    descriptors.forEach(descriptor => {
        variants[descriptor].forEach(variant => {
            allVariants.push({ descriptor, variant });
        });
    });

    // Evaluate all combinations of descriptor variants for consistency
    const scenarioCombinations = getScenarioCombinations(Object.values(variants));
    scenarioCombinations.forEach((scenario) => {
        let scenarioConsistent = true;

        // Check each pair within the scenario for consistency
        for (let i = 0; i < scenario.length; i++) {
            for (let j = i + 1; j < scenario.length; j++) {
                const indexI = getIndexInMatrix(scenario[i]);
                const indexJ = getIndexInMatrix(scenario[j]);
                const influence = cibMatrix[indexI][indexJ] + cibMatrix[indexJ][indexI];

                if (Math.abs(influence) > tolerance) {
                    scenarioConsistent = false;
                    break;
                }
            }
            if (!scenarioConsistent) break;
        }

        if (scenarioConsistent) {
            consistentScenarios.push(scenario);
        }
    });

    displayScenarioTableau(consistentScenarios);
}

// Helper function: Get index of variant in the cross-impact matrix
function getIndexInMatrix(variant) {
    let index = -1;
    descriptors.some((desc, i) => {
        if (variants[desc].includes(variant)) {
            index = variants[desc].indexOf(variant) + i * variants[desc].length;
            return true;
        }
    });
    return index;
}

// Helper function: Get all combinations of scenario variants
function getScenarioCombinations(variantGroups) {
    if (variantGroups.length === 0) return [[]];
    const [first, ...rest] = variantGroups;
    const combinationsWithoutFirst = getScenarioCombinations(rest);
    const combinationsWithFirst = [];
    first.forEach(variant => {
        combinationsWithoutFirst.forEach(combination => {
            combinationsWithFirst.push([variant, ...combination]);
        });
    });
    return combinationsWithFirst;
}

// Display consistent scenarios in the scenario tableau
function displayScenarioTableau(scenarios) {
    let tableauHtml = "<h3>Consistent Scenario Tableau:</h3><div id='scenarioTableau'>";
    scenarios.forEach((scenario, index) => {
        tableauHtml += `<div class='scenario'><h4>Scenario ${index + 1}</h4><p>`;
        scenario.forEach(variant => {
            tableauHtml += `${variant.descriptor}: ${variant.variant} <br>`;
        });
        tableauHtml += "</p></div>";
    });
    tableauHtml += "</div>";

    document.getElementById("consistentScenariosResult").innerHTML = tableauHtml;
}

// Update tolerance value based on user input
function updateTolerance() {
    tolerance = parseFloat(document.getElementById("toleranceInput").value);
}
