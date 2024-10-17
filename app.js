
// Initialize descriptors, variants, and cross-impact matrix
let descriptors = [];
let variants = {};
let cibMatrix = {};

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
    cibMatrix = projectData.cibMatrix || {};
    updateDescriptorList();
    generateCIBMatrix();
  };
  reader.readAsText(file);
}

// Descriptor and Variant Management
function addDescriptor() {
  const descriptorInput = document.getElementById('descriptorInput').value;
  if (descriptorInput && !descriptors.includes(descriptorInput)) {
    descriptors.push(descriptorInput);
    variants[descriptorInput] = [];
    document.getElementById('descriptorInput').value = ''; // Clear input
    updateDescriptorList(); // Update UI
    updateDescriptorSelect(); // Refresh dropdown
    generateCIBMatrix(); // Regenerate matrix with new descriptor
  } else {
    alert("Descriptor already exists or input is empty.");
  }
}

function updateDescriptorList() {
  const list = document.getElementById('descriptorList');
  list.innerHTML = ''; // Clear previous list
  descriptors.forEach(desc => {
    const listItem = document.createElement('li');
    listItem.textContent = `${desc} - Variants: ${variants[desc].join(", ")}`;
    list.appendChild(listItem);
  });
}

function updateDescriptorSelect() {
  const select = document.getElementById('descriptorSelect');
  select.innerHTML = ''; // Clear existing options
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
  if (descriptor && variant && !variants[descriptor].includes(variant)) {
    variants[descriptor].push(variant);
    document.getElementById('variantInput').value = ''; // Clear input
    updateDescriptorList(); // Refresh displayed descriptor list
    generateCIBMatrix(); // Regenerate matrix with new variant
  } else {
    alert("Variant already exists or descriptor is not selected.");
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
    updateDescriptorList();
    generateCIBMatrix();
  } else {
    alert("Please fill in all fields correctly for automatic generation.");
  }
}

// Generate a single, unified cross-impact matrix for all variants
function generateCIBMatrix() {
  cibMatrix = {};
  descriptors.forEach(desc => {
    cibMatrix[desc] = {};
    variants[desc].forEach(variant => {
      cibMatrix[desc][variant] = descriptors.reduce((acc, innerDesc) => {
        acc[innerDesc] = variants[innerDesc].reduce((variantAcc, innerVariant) => {
          variantAcc[innerVariant] = 0; // Initialize all combinations to 0
          return variantAcc;
        }, {});
        return acc;
      }, {});
    });
  });
  updateCIBMatrixDisplay();
}

// Display a unified matrix with variant relationships and disallow intra-descriptor influence
function updateCIBMatrixDisplay() {
  const matrixContainer = document.getElementById('cibMatrixContainer');
  matrixContainer.innerHTML = ''; // Clear previous content

  let matrixHtml = `<table><tr><th></th>`;

  // Header row: All descriptor variants
  descriptors.forEach(desc => {
    variants[desc].forEach(variant => {
      matrixHtml += `<th>${desc} - ${variant}</th>`;
    });
  });
  matrixHtml += '</tr>';

  // Generate rows with inputs
  descriptors.forEach(descRow => {
    variants[descRow].forEach(variantRow => {
      matrixHtml += `<tr><td>${descRow} - ${variantRow}</td>`;

      descriptors.forEach(descCol => {
        variants[descCol].forEach(variantCol => {
          let cellHtml;
          if (descRow === descCol) {
            // Disable inputs for variants of the same descriptor
            cellHtml = '<td>-</td>';
          } else {
            const inputId = `cib_${descRow}_${variantRow}_${descCol}_${variantCol}`;
            cellHtml = `<td><input type="number" id="${inputId}" value="0" min="-3" max="3"></td>`;
          }
          matrixHtml += cellHtml;
        });
      });

      matrixHtml += '</tr>';
    });
  });
  matrixHtml += '</table>';
  matrixContainer.innerHTML = matrixHtml;
}
