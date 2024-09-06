//Declaring needed variables.
const btnGenerateCertificate = document.getElementById("btn__generate");
const urlCsvClients =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRpM8gQpArKM1ARq4ghtn62WUnrvMoDohryaSXGh_aB5cDLETjxHnt9LPt5vHiLh2nskpkwcc3r4M5z/pub?output=csv";
let certificateInformation = [];
let certificateItems = [];
let importedData = [];

//Adding events.
btnGenerateCertificate.addEventListener("click", (e) => generateCertificate(e));
addRowButton.addEventListener("click", () => createNewRow());

document.addEventListener("DOMContentLoaded", async () => {
  const certificationData = JSON.parse(localStorage.getItem("certification"));
  if (!certificationData) {
    parseCSVFile();
    return;
  }

  const dateInput = document.querySelector("#date");
  const clientSelect = document.querySelector("#client");
  const referenceInput = document.querySelector("#reference");
  const projectInput = document.querySelector("#project");
  const startWeekInput = document.querySelector("#start_week");
  const endWeekInput = document.querySelector("#end_week");

  dateInput.value = certificationData.pickedDate;
  referenceInput.value = certificationData.reference;
  projectInput.value = certificationData.project;
  startWeekInput.value = certificationData.pickedStartWeek;
  endWeekInput.value = certificationData.pickedEndWeek;

  await parseCSVFile();
  clientSelect.value = certificationData.choosenClient;
  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";

  certificationData.certificateItems.forEach((item) => {
   createNewRow(item)
  });
});

document.querySelectorAll(".item-select").forEach((select, index) => {
  select.addEventListener("change", (e) => updateListItems(e, index));
});

function updateListItems(e, index) {
  const changedSelectIndex = index;
  const selectedIndex = e.target.selectedIndex;
  const selectedItem = importedData[selectedIndex];

  const rows = document.querySelectorAll("tbody tr");
  const rowSelected = rows[changedSelectIndex];

  if (!rowSelected) {
    console.error("La fila correspondiente no existe.");
    return;
  }

  const unitRowField = rowSelected.querySelector(".unit");

  if (unitRowField) {
    unitRowField.innerText = selectedItem.unit;
  } else {
    console.error("No se encontró el campo .unit en la fila seleccionada.");
  }
}

function createNewRow(data = {}) {
  const newRow = document.createElement("tr");
  let optionsHTML = generateOptionsForItemSelect(Object.keys(data).length !== 0 ? data : false);
  const rowIndex = document.querySelector("tbody").children.length;
  
  
  if (Object.keys(data).length === 0) {
    newRow.innerHTML = `
    <td class="item">
      <select class="item-select" onchange="updateListItems(event, ${rowIndex})"
          required>
          ${optionsHTML}
      </select>
    </td>
    <td class="unit">${importedData[0].unit}</td>
    <td><input class="quantity" type="number" min="1" value="1"></td>
    <td><button class="remove-row">Eliminar</button></td> `;
  } else {
    newRow.innerHTML = `
    <td class="item">
      <select class="item-select" onchange="updateListItems(event, ${rowIndex})"
          required>
          ${optionsHTML}
      </select>
    </td>
    <td class="unit">${data.unit}</td>
    <td><input class="quantity" type="number" min="1" value="${data.quantity}"></td>
    <td><button class="remove-row btn-delete">Eliminar</button></td> `;
  }

  document.querySelector("tbody").appendChild(newRow);
  newRow.querySelector(".remove-row").addEventListener("click", () => {
    newRow.remove();
    updateItemsLocalStorage;
  });
}

//Functions implementation.
function generateCertificate(e) {
  e.preventDefault();
  //Getting values from the upper inputs.
  const choosenClient = document.getElementById("client").value;
  const pickedDate = document.getElementById("date").value;
  const reference = document.getElementById("reference").value;
  const project = document.getElementById("project").value;
  const pickedStartWeek = document.getElementById("start_week").value;
  const pickedEndWeek = document.getElementById("end_week").value;

  //Getting values from table.
  const itemRows = document.querySelectorAll("tbody tr");

  certificateItems = Array.from(itemRows).map((item) => {
    const itemValueElem = item.querySelector(".item-select");
    const unitElem = item.querySelector(".unit");
    const quantityElem = item.querySelector("td .quantity");

    const itemValue = itemValueElem ? itemValueElem.value : "";
    const unit = unitElem ? unitElem.textContent : "";
    const quantity = quantityElem ? quantityElem.value : "";

    return { itemValue, unit, quantity };
  });

  //Data validation.
  if (
    choosenClient &&
    pickedDate &&
    reference &&
    project &&
    pickedStartWeek &&
    pickedEndWeek &&
    certificateItems.length !== 0
  ) {
    certificateInformation = {
      choosenClient,
      pickedDate,
      reference,
      project,
      pickedStartWeek,
      pickedEndWeek,
      certificateItems,
    };

    updateItemsLocalStorage();

    window.location.href = "../certification";
  } else {
    alert(
      "Debe ingresar todos los campos del formulario para poder generar un certificado."
    );
  }
}

function updateItemsLocalStorage(){
  localStorage.setItem(
    "certification",
    JSON.stringify(certificateInformation)
  );
}

async function parseCSVFile() {
  try {
    const response = await fetch(urlCsvClients);
    if (!response.ok) throw new Error("La respuesta de la red no fue exitosa");
    const data = await response.text();
    const rows = data.split("\n").filter((row) => row.trim() !== "");
    const headers = rows[0].split(",").map((header) => header.trim());
    const clientIndex = headers.indexOf("Kunden");
    const itemIndex = headers.indexOf("Artikel");
    const unitIndex = headers.indexOf("Einheit");

    if (clientIndex === -1 || itemIndex === -1 || unitIndex === -1)
      throw new Error("Faltan encabezados requeridos");

    importedData = rows.slice(1).map((row) => {
      const columns = parseCSVRow(row);
      const client = columns[clientIndex].replace(/^"|"$/g, "").trim();
      const item = columns[itemIndex].replace(/^"|"$/g, "").trim();
      const unit = columns[unitIndex].replace(/^"|"$/g, "").trim();

      return { client, item, unit };
    });

    displayClientsAtSelect();
    fillTableWithItems();
  } catch (error) {
    console.error("Error al importar la informacion:", error);
    alert("Hubo un problema al importar la informacion de excel.");
  }
}

function displayClientsAtSelect() {
  const selectClient = document.getElementById("client");

  if (!selectClient) {
    console.error("No se encontró el elemento select con el id 'client'.");
    return;
  }

  let optionsHTML = "";

  importedData.forEach((row) => {
    const clientEscaped = row.client
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    if (clientEscaped !== "")
      optionsHTML += `<option value="${clientEscaped}">${clientEscaped}</option>`;
  });

  selectClient.innerHTML = optionsHTML;
}

function fillTableWithItems() {
  const itemColumn = document.querySelector("tbody .item-select");
  const unitRow = document.querySelector("tbody .unit");

  if (!itemColumn) return;

  let optionsHTML = generateOptionsForItemSelect();

  itemColumn.innerHTML = optionsHTML;
  unitRow.innerText = importedData[0].unit
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function parseCSVRow(row) {
  const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/g;
  return row.split(re).map((field) => field.replace(/^"|"$/g, "").trim());
}

function generateOptionsForItemSelect(selectedValue = false) {
  let options = "";
  importedData.forEach((row) => {
    const itemEscaped = row.item.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    if (itemEscaped !== ""){
      if (selectedValue && selectedValue.itemValue === itemEscaped) {
        options += `<option value="${itemEscaped}" selected>${itemEscaped}</option>`;
      }else{
        options += `<option value="${itemEscaped}">${itemEscaped}</option>`;
      }
    }
  });

  return options;
}
