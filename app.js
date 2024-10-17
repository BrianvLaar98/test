
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
  if (descriptor && variant && !variants[descriptor].includes(variant)) {
    variants[descriptor].push(variant);
    document.getElementById('variantInput').value = '';
    updateDescriptorList();
    generateCIBMatrix();
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
    generateCIBMatrix();
  }
}

// Generate cross-impact matrix based on descriptor and variant combinations
function generateCIBMatrix() {
  cibMatrix = {};
  descriptors.forEach((desc) => {
    cibMatrix[desc] = {};
    variants[desc].forEach((variant) => {
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

// Display the cross-impact matrix with inputs for each variant combination
function updateCIBMatrixDisplay() {
  const matrixContainer = document.getElementById('cibMatrixContainer');
  matrixContainer.innerHTML = ''; // Clear previous content

  descriptors.forEach(desc => {
    variants[desc].forEach(variant => {
      let matrixHtml = `<table><caption>${desc} - ${variant}</caption><tr><th></th>`;
      
      // Add headers for each descriptor's variants
      descriptors.forEach(innerDesc => {
        variants[innerDesc].forEach(innerVariant => {
          matrixHtml += `<th>${innerDesc} - ${innerVariant}</th>`;
        });
      });
      matrixHtml += '</tr>';
      
      descriptors.forEach(innerDesc => {
        variants[innerDesc].forEach(innerVariant => {
          matrixHtml += `<tr><td>${innerDesc} - ${innerVariant}</td>`;
          
          descriptors.forEach((descCol) => {
            variants[descCol].forEach(variantCol => {
              const inputId = `cib_${desc}_${variant}_${innerDesc}_${innerVariant}_${descCol}_${variantCol}`;
              matrixHtml += `<td><input type="number" id="${inputId}" value="0" min="-3" max="3"></td>`;
            });
          });
          matrixHtml += '</tr>';
        });
      });
      matrixHtml += '</table><br>';
      matrixContainer.innerHTML += matrixHtml;
    });
  });
}
