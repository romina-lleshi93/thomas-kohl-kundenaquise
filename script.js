
const spaltenAnzahl = 12;
const checkboxSpalten = [6, 7, 8, 9, 10];
let aktuellerKundenIndex = null;

// 👉 HARDCODE DATEN
let daten = [
    ["1", "Max Mustermann", "", "", "", "", "false", "false", "false", "false", "false", ""],
    ["2", "Erika Musterfrau", "", "", "", "", "true", "false", "false", "false", "false", ""],
    []
];

// 👉 HARDCODE NOTIZEN
let notizenDaten = {};

function ladeDaten() {
    const tbody = document.querySelector("#kundenTabelle tbody");
    tbody.innerHTML = "";

    daten.forEach((zeileDaten, zeilenIndex) => {
        const tr = document.createElement("tr");
        tr.dataset.kundenIndex = zeilenIndex;

        for (let i = 0; i < spaltenAnzahl; i++) {
            const td = document.createElement("td");

            if (i === 0) {
                td.textContent = zeilenIndex + 1;
                td.contentEditable = "false";
            } else if (checkboxSpalten.includes(i)) {
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = zeileDaten[i] === "true";

                checkbox.addEventListener("change", () => {
                    speichereDaten();
                    aktualisiereZeilenfarbe(tr);
                    pruefeUndErstelleNeueZeile(tr);
                    filtereTabelle();
                });

                td.appendChild(checkbox);
            } else {
                td.contentEditable = "true";
                td.textContent = zeileDaten[i] && zeileDaten[i].trim() !== "" ? zeileDaten[i] : "\u00A0";

                if (i === 1) {
                    td.style.cursor = "pointer";
                    td.addEventListener("dblclick", () => {
                        const kundenIndex = parseInt(tr.dataset.kundenIndex, 10);
                        oeffneNotizModal(kundenIndex);
                    });
                }

                td.addEventListener("input", () => {
                    speichereDaten();
                    pruefeUndErstelleNeueZeile(tr);
                    filtereTabelle();
                });
            }

            tr.appendChild(td);
        }

        aktualisiereZeilenfarbe(tr);
        tbody.appendChild(tr);
    });

    filtereTabelle();
}

function speichereDaten(neueDaten = null) {
    const tbody = document.querySelector("#kundenTabelle tbody");

    daten = neueDaten || Array.from(tbody.rows).map(tr =>
        Array.from(tr.cells).map((td, i) => {
            if (i === 0) return (parseInt(td.textContent) || "");
            if (checkboxSpalten.includes(i)) {
                const checkbox = td.querySelector("input[type='checkbox']");
                return checkbox && checkbox.checked ? "true" : "false";
            }
            return td.textContent.trim();
        })
    );
}

function aktualisiereZeilenfarbe(tr) {
    tr.classList.remove("zeile-gruen", "zeile-gelb", "zeile-rot");

    const checkboxZellen = checkboxSpalten.map(i => tr.cells[i]);
    const checkedCount = checkboxZellen.reduce((summe, zelle) => {
        const checkbox = zelle.querySelector("input[type='checkbox']");
        return summe + (checkbox && checkbox.checked ? 1 : 0);
    }, 0);

    if (checkedCount === checkboxSpalten.length) {
        tr.classList.add("zeile-gruen");
    } else if (checkedCount === 0) {
        tr.classList.add("zeile-rot");
    } else {
        tr.classList.add("zeile-gelb");
    }
}

function pruefeUndErstelleNeueZeile(tr) {
    const tbody = document.querySelector("#kundenTabelle tbody");
    const istLetzteZeile = tr === tbody.lastElementChild;
    if (!istLetzteZeile) return;

    const datenZellen = Array.from(tr.cells).slice(1, 6);
    const hatInhalt = datenZellen.some(td => td.textContent.trim() !== "");

    if (!hatInhalt) return;

    daten.push([]);
    ladeDaten();
}

function filtereTabelle() {
    const suchbegriff = document.getElementById("suchfeld").value.toLowerCase();
    const zeilen = document.querySelectorAll("#kundenTabelle tbody tr");

    const filterChecks = document.querySelectorAll(".filter-check");
    const aktiveFilter = Array.from(filterChecks)
        .filter(chk => chk.checked)
        .map(chk => chk.value);

    zeilen.forEach(tr => {
        const istGruen = tr.classList.contains("zeile-gruen");
        const istGelb = tr.classList.contains("zeile-gelb");
        const istRot = tr.classList.contains("zeile-rot");

        let farbePasst =
            (istGruen && aktiveFilter.includes("gruen")) ||
            (istGelb && aktiveFilter.includes("gelb")) ||
            (istRot && aktiveFilter.includes("rot"));

        if (aktiveFilter.length === 0) {
            farbePasst = true;
        }

        const zellenText = Array.from(tr.cells)
            .map(td => td.textContent.toLowerCase())
            .join(" ");

        const suchbegriffPasst = zellenText.includes(suchbegriff);

        tr.style.display = (farbePasst && suchbegriffPasst) ? "" : "none";
    });
}

// --- NOTIZEN ---

function oeffneNotizModal(kundenIndex) {
    aktuellerKundenIndex = kundenIndex;
    document.getElementById("notizDatum").value = "";
    document.getElementById("notizText").value = "";
    ladeNotizen(kundenIndex);
    zeigeModal(true);
}

function zeigeModal(sichtbar) {
    document.getElementById("notizModal").style.display = sichtbar ? "block" : "none";
    document.getElementById("modalOverlay").style.display = sichtbar ? "block" : "none";
}

function schliesseNotizModal() {
    zeigeModal(false);
    aktuellerKundenIndex = null;
}

function ladeNotizen(kundenIndex) {
    const notizen = Array.isArray(notizenDaten[kundenIndex]) ? notizenDaten[kundenIndex] : [];

    const liste = document.getElementById("notizenListe");
    liste.innerHTML = "";

    if (notizen.length === 0) {
        liste.innerHTML = "<p>Keine Gesprächsnotizen vorhanden.</p>";
        return;
    }

    notizen.forEach((eintrag, index) => {
        const div = document.createElement("div");
        div.className = "notiz-eintrag";

        const datum = document.createElement("small");
        datum.textContent = new Date(eintrag.datum).toLocaleDateString();

        const text = document.createElement("p");
        text.textContent = eintrag.text;

        const loeschenBtn = document.createElement("button");
        loeschenBtn.textContent = "Löschen";
        loeschenBtn.style.marginLeft = "10px";
        loeschenBtn.onclick = () => {
            loescheNotiz(kundenIndex, index);
        };

        div.appendChild(datum);
        div.appendChild(text);
        div.appendChild(loeschenBtn);

        liste.appendChild(div);
    });
}

function speichereNotiz() {
    const datumInput = document.getElementById("notizDatum").value;
    const textInput = document.getElementById("notizText").value.trim();

    if (!datumInput || !textInput) return;

    if (!Array.isArray(notizenDaten[aktuellerKundenIndex])) {
        notizenDaten[aktuellerKundenIndex] = [];
    }

    notizenDaten[aktuellerKundenIndex].push({
        datum: datumInput,
        text: textInput
    });

    ladeNotizen(aktuellerKundenIndex);

    document.getElementById("notizDatum").value = "";
    document.getElementById("notizText").value = "";
}

function loescheNotiz(kundenIndex, notizIndex) {
    if (!notizenDaten[kundenIndex]) return;

    notizenDaten[kundenIndex].splice(notizIndex, 1);

    if (notizenDaten[kundenIndex].length === 0) {
        delete notizenDaten[kundenIndex];
    }

    ladeNotizen(kundenIndex);
}

// Initial laden
ladeDaten();