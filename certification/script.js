document.addEventListener("DOMContentLoaded", ()=> {
    const certificationData = JSON.parse(localStorage.getItem("certification"));
    const tbody = document.querySelector("tbody");
    if (!certificationData){
        alert("No hay informacion para generar una certificacion, seras direccionado al formulario para ingresar los datos necesarios.")
        window.location.href = "../certificationForm"
    }
    const dateElement = document.getElementById("date");
    const clientElement = document.getElementById("client");
    const referenceElement = document.getElementById("reference");
    const projectElement = document.getElementById("project");
    const startDate = document.getElementById("start__date");
    const endDate = document.getElementById("end__date");

    const date = new Date(certificationData.pickedDate);
    const formattedDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    dateElement.innerText = formattedDate;
    clientElement.innerText = certificationData.choosenClient;
    referenceElement.innerText = certificationData.reference;
    projectElement.innerText = certificationData.project;
    startDate.innerText = certificationData.pickedStartWeek.slice(-2);
    endDate.innerText = certificationData.pickedEndWeek.slice(-2);

    let htmlForTbody = "";

    certificationData.certificateItems.forEach(item => {
        htmlForTbody += `
        <tr>
            <td class="item">${item.itemValue}</td>
            <td class="unit">${item.unit}</td>
            <td class="quantity">${item.quantity}</td>
        </tr>      
        `;
    });

    tbody.innerHTML = htmlForTbody;



})