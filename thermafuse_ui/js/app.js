"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initUploads();
    initGuidance();
    initViewerTabs();
    initRunButtons();
    initReset();
});

const state = {
    optical: null,
    thermal: null,
    activeView: "optical"
};

function initNavigation() {
    const items = document.querySelectorAll(".nav-item");

    items.forEach(item => {
        item.addEventListener("click", () => {
            items.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
        });
    });
}

function initUploads() {
    document.querySelectorAll(".dropzone").forEach(zone => {
        const inputId = zone.dataset.input;
        const input = document.getElementById(inputId);

        zone.addEventListener("click", () => input.click());

        ["dragenter", "dragover"].forEach(eventName => {
            zone.addEventListener(eventName, event => {
                event.preventDefault();
                zone.classList.add("dragging");
            });
        });

        ["dragleave", "drop"].forEach(eventName => {
            zone.addEventListener(eventName, event => {
                event.preventDefault();
                zone.classList.remove("dragging");
            });
        });

        zone.addEventListener("drop", event => {
            const file = event.dataTransfer.files[0];
            if (file) handleFile(inputId, file);
        });

        input.addEventListener("change", event => {
            const file = event.target.files[0];
            if (file) handleFile(inputId, file);
        });
    });

    document.querySelectorAll(".remove-file").forEach(button => {
        button.addEventListener("click", () => {
            const inputId = button.dataset.remove;
            removeFile(inputId);
        });
    });
}

function handleFile(inputId, file) {
    const type = inputId === "opticalInput" ? "optical" : "thermal";
    state[type] = file;

    const card = document.getElementById(`${type}Card`);
    const badge = document.getElementById(`${type}Badge`);
    const info = document.getElementById(`${type}Info`);
    const name = info.querySelector(".file-name");

    card.classList.add("loaded");
    badge.textContent = "Loaded";
    badge.classList.add("loaded");
    name.textContent = `${file.name} · ${formatBytes(file.size)}`;
    info.classList.add("show");

    updateInputStatus();

    if (!state.activeView || state.activeView === type) {
        showPreview(type);
    } else if (state.activeView === "optical" && state.optical) {
        showPreview("optical");
    }
}

function removeFile(inputId) {
    const type = inputId === "opticalInput" ? "optical" : "thermal";
    const input = document.getElementById(inputId);
    const card = document.getElementById(`${type}Card`);
    const badge = document.getElementById(`${type}Badge`);
    const info = document.getElementById(`${type}Info`);

    state[type] = null;
    input.value = "";
    card.classList.remove("loaded");
    badge.textContent = "Required";
    badge.classList.remove("loaded");
    info.classList.remove("show");

    updateInputStatus();

    if (state[type] === null && state.activeView === type) {
        showEmptyViewer();
    }
}

function updateInputStatus() {
    const loaded = Number(Boolean(state.optical)) + Number(Boolean(state.thermal));
    document.getElementById("inputCount").textContent = `${loaded} / 2 loaded`;

    const validation = document.getElementById("validation");

    if (loaded === 2) {
        validation.classList.add("ready");
        validation.querySelector("strong").textContent = "Both inputs loaded";
        validation.querySelector("small").textContent =
            "Ready to validate alignment and start reconstruction.";
    } else {
        validation.classList.remove("ready");
        validation.querySelector("strong").textContent = "Waiting for both inputs";
        validation.querySelector("small").textContent =
            "Upload the optical and thermal images to continue.";
    }

    document.getElementById("stepAlign").classList.toggle("done", loaded === 2);
}

function showPreview(type) {
    const file = state[type];

    if (!file) {
        showEmptyViewer();
        return;
    }

    state.activeView = type;

    const empty = document.getElementById("emptyView");
    const image = document.getElementById("previewImage");
    const label = document.getElementById("viewerLabel");
    const resolution = document.getElementById("viewerResolution");
    const stateText = document.getElementById("viewerState");

    const url = URL.createObjectURL(file);

    image.onload = () => URL.revokeObjectURL(url);
    image.src = url;

    empty.style.display = "none";
    image.style.display = "block";
    label.style.display = "block";
    resolution.style.display = "block";

    label.textContent = type === "optical" ? "OPTICAL GUIDANCE" : "THERMAL INPUT";
    resolution.textContent = type === "optical" ? "HIGH-RES GUIDANCE" : "LOW-RES TIR";
    stateText.textContent = file.name;

    document.querySelectorAll(".tool").forEach(tool => {
        tool.classList.toggle("active", tool.dataset.view === type);
    });
}

function showEmptyViewer() {
    document.getElementById("emptyView").style.display = "block";
    document.getElementById("previewImage").style.display = "none";
    document.getElementById("viewerLabel").style.display = "none";
    document.getElementById("viewerResolution").style.display = "none";
    document.getElementById("viewerState").textContent = "No image loaded";
}

function initViewerTabs() {
    document.querySelectorAll(".tool").forEach(tool => {
        tool.addEventListener("click", () => {
            const view = tool.dataset.view;

            if (view === "result") {
                if (!document.getElementById("resultStatus").textContent.includes("READY")) {
                    showEmptyViewer();
                    document.getElementById("viewerState").textContent =
                        "Run reconstruction to view result";
                    return;
                }
                showResultPlaceholder();
                return;
            }

            if (!state[view]) {
                showEmptyViewer();
                document.getElementById("viewerState").textContent =
                    view === "optical"
                        ? "Upload optical image"
                        : "Upload thermal image";
                return;
            }

            showPreview(view);
        });
    });
}

function showResultPlaceholder() {
    const image = document.getElementById("previewImage");
    const empty = document.getElementById("emptyView");
    const label = document.getElementById("viewerLabel");
    const resolution = document.getElementById("viewerResolution");

    state.activeView = "result";

    empty.style.display = "none";
    image.style.display = "block";
    image.removeAttribute("src");

    image.style.background = `
        radial-gradient(circle at 67% 43%,
        #d7a45b 0%,
        #9d6c48 12%,
        #485047 29%,
        #253a3d 48%,
        #121d25 78%)
    `;

    label.style.display = "block";
    resolution.style.display = "block";
    label.textContent = "SUPER-RESOLVED THERMAL";
    resolution.textContent = "30 m OUTPUT";

    document.getElementById("viewerState").textContent = "Reconstruction result";
}

function initGuidance() {
    const range = document.getElementById("guidanceRange");
    const value = document.getElementById("guidanceValue");

    range.addEventListener("input", () => {
        value.textContent = `${range.value}%`;
    });
}

function initRunButtons() {
    document.getElementById("runSR").addEventListener("click", runReconstruction);
    document.getElementById("runSRBottom").addEventListener("click", runReconstruction);
}

async function runReconstruction() {
    if (!state.optical || !state.thermal) {
        flashValidation();
        return;
    }

    const buttons = [
        document.getElementById("runSR"),
        document.getElementById("runSRBottom")
    ];

    buttons.forEach(button => {
        button.disabled = true;
        button.textContent = "Processing...";
    });

    const steps = [
        document.getElementById("stepAlign"),
        document.getElementById("stepFeatures"),
        document.getElementById("stepFusion"),
        document.getElementById("stepValidation")
    ];

    for (let i = 0; i < steps.length; i++) {
        steps[i].classList.remove("current");
        steps[i].classList.add("done");

        if (steps[i + 1]) {
            steps[i + 1].classList.add("current");
        }

        await wait(650);
    }

    document.getElementById("stepValidation").classList.remove("current");

    document.getElementById("resultStatus").textContent = "READY";
    document.getElementById("resultStatus").style.color = "var(--accent)";

    document.getElementById("rmse").textContent = "1.84";
    document.getElementById("psnr").textContent = "31.6";
    document.getElementById("ssim").textContent = "0.921";
    document.getElementById("inference").textContent = "2.8";

    buttons.forEach(button => {
        button.disabled = false;
        button.textContent = "Run Again";
    });

    document.querySelector('[data-view="result"]').click();
}

function flashValidation() {
    const validation = document.getElementById("validation");

    validation.animate(
        [
            { transform: "translateX(0)" },
            { transform: "translateX(-4px)" },
            { transform: "translateX(4px)" },
            { transform: "translateX(0)" }
        ],
        { duration: 260 }
    );

    validation.querySelector("strong").textContent =
        "Two inputs are required";

    setTimeout(updateInputStatus, 1800);
}

function initReset() {
    document.querySelector(".btn:not(.btn-primary)").addEventListener("click", () => {
        removeFile("opticalInput");
        removeFile("thermalInput");

        document.getElementById("resultStatus").textContent = "NOT RUN";
        document.getElementById("resultStatus").style.color = "";

        ["rmse", "psnr", "ssim", "inference"].forEach(id => {
            document.getElementById(id).textContent = "—";
        });

        document.querySelectorAll(".step").forEach(step => {
            step.classList.remove("done", "current");
        });

        showEmptyViewer();
    });
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
