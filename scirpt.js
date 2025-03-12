"use strict";

// Store imported data globally
window.importedRVToolsData = [];

// Modal controls
document.getElementById('open-rvtools-modal').addEventListener('click', () => {
  document.getElementById('rvtools-modal').classList.remove('hidden');
});
document.getElementById('close-rvtools-modal').addEventListener('click', () => {
  document.getElementById('rvtools-modal').classList.add('hidden');
});
document.getElementById('toggle-night-mode').addEventListener('click', () => {
  document.body.classList.toggle('night-mode');
});

// File upload handling
document.getElementById('rvtools-file-input').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (evt) {
    const workbook = XLSX.read(evt.target.result, { type: 'array' });

    if (!workbook.Sheets['vInfo']) {
      alert('vInfo sheet not found in this Excel file!');
      return;
    }

    const sheet = workbook.Sheets['vInfo'];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const headers = rows[0];
    const vmIndex = headers.indexOf('VM');
    const cpusIndex = headers.indexOf('CPUs');
    const memoryIndex = headers.indexOf('Memory');
    const provisionedIndex = headers.indexOf('Provisioned MB');
    const osIndex = headers.indexOf('OS according to the configuration file');

    if ([vmIndex, cpusIndex, memoryIndex, provisionedIndex, osIndex].includes(-1)) {
      alert('Required columns not found in vInfo sheet!');
      return;
    }

    window.importedRVToolsData = rows.slice(1).map(row => ({
      vm: row[vmIndex] || 'Unknown',
      cpus: parseInt(row[cpusIndex]) || 0,
      memoryGiB: (parseInt(row[memoryIndex]) || 0) / 1024,
      provisionedGiB: (parseInt(row[provisionedIndex]) || 0) / 1024,
      os: row[osIndex] || 'Unknown',
    }));

    renderRVToolsTable(window.importedRVToolsData);
  };

  reader.readAsArrayBuffer(file);
});

// Render VMs in a table
function renderRVToolsTable(data) {
  const display = document.getElementById('rvtools-data-display');
  display.innerHTML = '';

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>VM</th>
        <th>CPUs</th>
        <th>Memory (GiB)</th>
        <th>Provisioned (GiB)</th>
        <th>OS</th>
      </tr>
    </thead>
  `;
  const tbody = document.createElement('tbody');

  data.forEach((vm, index) => {
    const tr = document.createElement('tr');
    tr.dataset.index = index;
    tr.innerHTML = `
      <td>${vm.vm}</td>
      <td>${vm.cpus}</td>
      <td>${vm.memoryGiB.toFixed(2)}</td>
      <td>${vm.provisionedGiB.toFixed(2)}</td>
      <td>${vm.os}</td>
    `;
    tr.addEventListener('click', () => {
      tr.classList.toggle('selected');
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  display.appendChild(table);

  document.getElementById('summarise-selected-vms').style.display = 'block';
}

// Summarise selected VMs
document.getElementById('summarise-selected-vms').addEventListener('click', function () {
  const selectedRows = document.querySelectorAll('#rvtools-data-display tr.selected');
  if (selectedRows.length === 0) {
    alert('No VMs selected!');
    return;
  }

  let totalCPUs = 0;
  let totalMemory = 0;
  let totalProvisioned = 0;

  selectedRows.forEach(row => {
    const vm = window.importedRVToolsData[row.dataset.index];
    totalCPUs += vm.cpus;
    totalMemory += vm.memoryGiB;
    totalProvisioned += vm.provisionedGiB;
  });

  document.getElementById('rvtools-summary-container').innerHTML = `
    <h3>VM Summary</h3>
    <p>Total CPUs: ${totalCPUs}</p>
    <p>Total Memory (GiB): ${totalMemory.toFixed(2)}</p>
    <p>Total Provisioned Storage (GiB): ${totalProvisioned.toFixed(2)}</p>
  `;
});
