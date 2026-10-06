"use strict";
const uploadBtn = document.getElementById("uploadBtn");
uploadBtn.onclick = async () => {
    const fileInput = document.getElementById("fileInput");
    if (!fileInput.files || fileInput.files.length === 0) {
        alert("Please select a file");
        return;
    }
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);
    try {
        const response = await fetch("http://127.0.0.1:8000/detect", {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        displayResult(data);
    }
    catch (error) {
        console.error("Error:", error);
    }
};
function displayResult(data) {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `
        <p><b>Severity:</b> ${data.severity?.toFixed(2)}</p>
        <p><b>Priority:</b> ${data.priority_label}</p>
        <p><b>Score:</b> ${data.priority_score?.toFixed(2)}</p>
    `;
}
