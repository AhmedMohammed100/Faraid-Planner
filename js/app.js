import {
    calculateFaraid
} from "./faraid.js";

import {
    createEmptyCase,
    saveCase,
    loadCase,
    deleteSavedCase
} from "./storage.js";

import {
    generateBlueprint
} from "./blueprint.js";


let currentCase =
    createEmptyCase();


let assetCounter = 0;

let propertyCounter = 0;


/* --------------------------------------------------
   DOM HELPERS
-------------------------------------------------- */

function $(id) {
    return document.getElementById(id);
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* --------------------------------------------------
   ASSET MANAGEMENT
-------------------------------------------------- */

function addAsset(asset = {}) {

    assetCounter++;

    const row =
        document.createElement("div");


    row.className =
        "asset-row";


    row.dataset.assetId =
        assetCounter;


    row.innerHTML = `

        <div class="form-group">

            <label>
                Asset / Property
            </label>

            <input
                type="text"
                class="asset-name"
                value="${escapeHTML(asset.name || "")}"
                placeholder="Family house"
            >

        </div>


        <div class="form-group">

            <label>
                Type
            </label>

            <select class="asset-type">

                <option value="House">
                    House
                </option>

                <option value="Land">
                    Land / Farmland
                </option>

                <option value="Commercial">
                    Commercial Property
                </option>

                <option value="Vehicle">
                    Vehicle
                </option>

                <option value="Business">
                    Business Asset
                </option>

                <option value="Bank">
                    Bank / Cash
                </option>

                <option value="Gold">
                    Gold / Jewellery
                </option>

                <option value="Investment">
                    Investment
                </option>

                <option value="Other">
                    Other
                </option>

            </select>

        </div>


        <div class="form-group">

            <label>
                Ownership / Notes
            </label>

            <input
                type="text"
                class="asset-notes"
                value="${escapeHTML(asset.notes || "")}"
                placeholder="100% deceased; title pending"
            >

        </div>


        <button
            type="button"
            class="remove-btn remove-asset"
        >
            Remove
        </button>

    `;


    $("assetsContainer")
        .appendChild(row);


    const select =
        row.querySelector(".asset-type");


    if (asset.type) {
        select.value = asset.type;
    }
}


function getAssets() {

    return [
        ...document.querySelectorAll(
            ".asset-row"
        )
    ]
        .map(row => ({

            name:
                row.querySelector(
                    ".asset-name"
                ).value.trim(),

            type:
                row.querySelector(
                    ".asset-type"
                ).value,

            notes:
                row.querySelector(
                    ".asset-notes"
                ).value.trim()

        }))
        .filter(asset =>
            asset.name ||
            asset.notes
        );
}


/* --------------------------------------------------
   PROPERTY PLANS
-------------------------------------------------- */

function addPropertyPlan(plan = {}) {

    propertyCounter++;

    const row =
        document.createElement("div");


    row.className =
        "property-row";


    row.dataset.propertyId =
        propertyCounter;


    row.innerHTML = `

        <div class="form-group">

            <label>
                Property
            </label>

            <input
                type="text"
                class="property-name"
                value="${escapeHTML(plan.property || "")}"
                placeholder="Family house"
            >

        </div>


        <div class="form-group">

            <label>
                Proposed Method
            </label>

            <select class="property-method">

                <option>
                    Retain jointly
                </option>

                <option>
                    Allocate to one heir
                </option>

                <option>
                    Sell and distribute
                </option>

                <option>
                    Physical partition
                </option>

                <option>
                    Lease / income sharing
                </option>

                <option>
                    Pending review
                </option>

            </select>

        </div>


        <div class="form-group">

            <label>
                Action / Conditions
            </label>

            <input
                type="text"
                class="property-notes"
                value="${escapeHTML(plan.notes || "")}"
                placeholder="Valuation, consent, title transfer..."
            >

        </div>


        <button
            type="button"
            class="remove-btn remove-property"
        >
            Remove
        </button>

    `;


    $("propertyPlansContainer")
        .appendChild(row);


    if (plan.method) {

        row.querySelector(
            ".property-method"
        ).value = plan.method;

    }
}


function getPropertyPlans() {

    return [
        ...document.querySelectorAll(
            ".property-row"
        )
    ]
        .map(row => ({

            property:
                row.querySelector(
                    ".property-name"
                ).value.trim(),

            method:
                row.querySelector(
                    ".property-method"
                ).value,

            notes:
                row.querySelector(
                    ".property-notes"
                ).value.trim()

        }))
        .filter(plan =>
            plan.property ||
            plan.notes
        );
}


/* --------------------------------------------------
   FAMILY INPUT
-------------------------------------------------- */

function isYes(id) {

    return $(id).value === "1";
}


function getNumber(id) {

    const value =
        Number($(id).value);


    if (!Number.isFinite(value)) {
        return 0;
    }


    return Math.max(
        0,
        Math.floor(value)
    );
}


function getFamilyData() {

    return {

        husband:
            isYes("husband"),

        wives:
            getNumber("wives"),

        sons:
            getNumber("sons"),

        daughters:
            getNumber("daughters"),

        father:
            isYes("father"),

        mother:
            isYes("mother"),

        paternalGrandfather:
            isYes("paternalGrandfather"),

        maternalGrandmother:
            isYes("maternalGrandmother"),

        fullBrothers:
            getNumber("fullBrothers"),

        fullSisters:
            getNumber("fullSisters"),

        maternalSiblings:
            getNumber("maternalSiblings"),

        sonGrandchildren:
            isYes("sonGrandchildren")

    };
}


/* --------------------------------------------------
   CASE COLLECTION
-------------------------------------------------- */

function collectCaseFromUI() {

    const data =
        createEmptyCase();


    data.caseName =
        $("caseName").value.trim();


    data.deceased = {

        name:
            $("deceasedName").value.trim(),

        deathDate:
            $("deathDate").value,

        jurisdiction:
            $("jurisdiction").value.trim(),

        administrator:
            $("administrator").value.trim()

    };


    data.estate = {

        assets:
            getAssets()

    };


    data.obligations = {

        debts:
            $("debts").value.trim(),

        funeralExpenses:
            $("funeralExpenses").value.trim(),

        wasiyyah:
            $("wasiyyah").value.trim()

    };


    data.family =
        getFamilyData();


    data.propertyPlans =
        getPropertyPlans();


    data.settlement = {

        notes:
            $("settlementNotes").value.trim(),

        scholarReviewer:
            $("scholarReviewer").value.trim(),

        legalReviewer:
            $("legalReviewer").value.trim()

    };


    data.ownershipChecks =
        collectChecks([
            "ownership",
            "jointOwnership",
            "assetSearch"
        ]);


    data.completionChecks =
        collectChecks([
            "scholarReview",
            "heirNotification",
            "settlementAgreement",
            "legalTransfer"
        ]);


    data.faraidResult =
        currentCase.faraidResult;


    return data;
}


/* --------------------------------------------------
   CHECKBOXES
-------------------------------------------------- */

function collectChecks(names) {

    const result = {};


    names.forEach(name => {

        const element =
            document.querySelector(
                `[data-check="${name}"]`
            );


        result[name] =
            element
                ? element.checked
                : false;

    });


    return result;
}


function applyChecks(checks = {}) {

    Object.entries(checks)
        .forEach(([name, checked]) => {

            const element =
                document.querySelector(
                    `[data-check="${name}"]`
                );


            if (element) {

                element.checked =
                    Boolean(checked);

            }

        });

}


/* --------------------------------------------------
   FARAID
-------------------------------------------------- */

function determineFaraid() {

    const family =
        getFamilyData();


    const result =
        calculateFaraid(family);


    currentCase =
        collectCaseFromUI();


    currentCase.faraidResult =
        result;


    renderFaraidResult(result);

    updateDashboard();

    renderActions();

}


function renderFaraidResult(result) {

    if (!result) {

        $("faraidResult").innerHTML = "";

        return;

    }


    const eligible =
        result.eligible || [];


    const excluded =
        result.excluded || [];


    const reviewFlags =
        result.reviewFlags || [];


    let html = `

        <div class="card">

            <h3>
                Faraid Framework Result
            </h3>

            <p>
                <strong>Status:</strong>
                ${escapeHTML(result.status)}
            </p>

    `;


    if (eligible.length) {

        html += `

            <h4>
                Eligible / Supported Heirs
            </h4>

            <div class="table-wrapper">

                <table>

                    <thead>

                        <tr>
                            <th>Heir</th>
                            <th>Category</th>
                            <th>Share</th>
                            <th>Reason</th>
                        </tr>

                    </thead>

                    <tbody>

                        ${eligible.map(item => `

                            <tr>

                                <td>
                                    <strong>
                                        ${escapeHTML(item.heir)}
                                    </strong>

                                    ${
                                        item.count > 1
                                            ? `<br>
                                               <small>
                                                   ${item.count} persons
                                               </small>`
                                            : ""
                                    }
                                </td>

                                <td>
                                    <span class="
                                        badge
                                        ${
                                            item.category === "fixed"
                                                ? "badge-fixed"
                                                : "badge-residuary"
                                        }
                                    ">
                                        ${escapeHTML(
                                            item.category
                                        )}
                                    </span>
                                </td>

                                <td>
                                    <strong>
                                        ${escapeHTML(item.share)}
                                    </strong>
                                </td>

                                <td>
                                    ${escapeHTML(item.reason)}
                                </td>

                            </tr>

                        `).join("")}

                    </tbody>

                </table>

            </div>

        `;

    }


    if (excluded.length) {

        html += `

            <h4>
                Excluded Heirs
            </h4>

            <div class="table-wrapper">

                <table>

                    <thead>
                        <tr>
                            <th>Heir</th>
                            <th>Reason</th>
                        </tr>
                    </thead>

                    <tbody>

                        ${excluded.map(item => `

                            <tr>

                                <td>
                                    <span class="
                                        badge
                                        badge-excluded
                                    ">
                                        ${escapeHTML(item.heir)}
                                    </span>
                                </td>

                                <td>
                                    ${escapeHTML(item.reason)}
                                </td>

                            </tr>

                        `).join("")}

                    </tbody>

                </table>

            </div>

        `;

    }


    if (reviewFlags.length) {

        html += `

            <div class="
                notice
                notice-warning
            ">

                <strong>
                    Specialist Review Required
                </strong>

                <ul>

                    ${reviewFlags.map(flag => `

                        <li>
                            ${escapeHTML(flag.message)}
                        </li>

                    `).join("")}

                </ul>

            </div>

        `;

    }


    html += `

            <div class="
                notice
                notice-info
            ">

                <strong>
                    Important:
                </strong>

                This result is a Faraid framework,
                not a final legal or scholarly determination.

            </div>

        </div>

    `;


    $("faraidResult").innerHTML =
        html;
}


/* --------------------------------------------------
   ACTION TRACKER
-------------------------------------------------- */

function buildActions() {

    const actions = [];


    const assets =
        getAssets();


    const checks =
        collectChecks([
            "ownership",
            "jointOwnership",
            "assetSearch",
            "debts",
            "funeral",
            "wasiyyah",
            "scholarReview",
            "heirNotification",
            "settlementAgreement",
            "legalTransfer"
        ]);


    if (!assets.length) {

        actions.push({

            status: "open",

            title:
                "Identify estate assets",

            description:
                "Create a complete inventory of property belonging to the deceased."

        });

    }


    if (!checks.ownership) {

        actions.push({

            status: "open",

            title:
                "Collect ownership documents",

            description:
                "Collect titles, deeds, registration records and other ownership evidence."

        });

    }


    if (!checks.jointOwnership) {

        actions.push({

            status: "pending",

            title:
                "Review joint ownership",

            description:
                "Determine which portions of jointly owned assets belong to the deceased."

        });

    }


    if (!checks.assetSearch) {

        actions.push({

            status: "pending",

            title:
                "Complete asset search",

            description:
                "Take reasonable steps to identify undisclosed estate assets."

        });

    }


    if (!checks.debts) {

        actions.push({

            status: "pending",

            title:
                "Document debts",

            description:
                "Identify creditors, amounts and supporting evidence."

        });

    }


    if (!checks.funeral) {

        actions.push({

            status: "pending",

            title:
                "Document funeral expenses",

            description:
                "Record relevant funeral and burial expenses."

        });

    }


    if (!checks.wasiyyah) {

        actions.push({

            status: "review",

            title:
                "Review Wasiyyah",

            description:
                "Locate the Wasiyyah and refer it for Islamic and legal review."

        });

    }


    if (!currentCase.faraidResult) {

        actions.push({

            status: "open",

            title:
                "Determine Faraid framework",

            description:
                "Complete the surviving-heir information and run the Faraid engine."

        });

    }


    if (
        currentCase.faraidResult &&
        currentCase.faraidResult.reviewFlags.length
    ) {

        actions.push({

            status: "review",

            title:
                "Obtain specialist Faraid review",

            description:
                "The case contains one or more issues that require detailed jurisprudential review."

        });

    }


    if (!getPropertyPlans().length) {

        actions.push({

            status: "pending",

            title:
                "Create property allocation plan",

            description:
                "Determine how each physical asset may be retained, transferred, divided or sold."

        });

    }


    if (!checks.scholarReview) {

        actions.push({

            status: "review",

            title:
                "Scholar review",

            description:
                "Have the Faraid framework reviewed by a qualified Islamic scholar."

        });

    }


    if (!checks.heirNotification) {

        actions.push({

            status: "pending",

            title:
                "Notify heirs",

            description:
                "Ensure heirs are informed of the established inheritance framework."

        });

    }


    if (!checks.settlementAgreement) {

        actions.push({

            status: "pending",

            title:
                "Document settlement",

            description:
                "Record the practical property settlement after entitlement has been established."

        });

    }


    if (!checks.legalTransfer) {

        actions.push({

            status: "open",

            title:
                "Complete legal transfer",

            description:
                "Complete required registrations, title transfers and other legal steps."

        });

    }


    return actions;
}


function renderActions() {

    const actions =
        buildActions();


    if (!actions.length) {

        $("actionsList").innerHTML = `

            <div class="
                notice
                notice-success
            ">

                <strong>
                    No outstanding actions.
                </strong>

                All tracked actions have been completed.

            </div>

        `;

        return;

    }


    $("actionsList").innerHTML = `

        <div class="action-list">

            ${actions.map(action => `

                <div class="action-item">

                    <span class="
                        action-dot
                        ${escapeHTML(action.status)}
                    "></span>

                    <div>

                        <h4>
                            ${escapeHTML(action.title)}
                        </h4>

                        <p>
                            ${escapeHTML(action.description)}
                        </p>

                    </div>

                    <span class="
                        action-status
                        badge-${action.status === "review"
                            ? "review"
                            : action.status === "open"
                                ? "excluded"
                                : "residuary"}
                    ">
                        ${escapeHTML(
                            action.status.toUpperCase()
                        )}
                    </span>

                </div>

            `).join("")}

        </div>

    `;
}


/* --------------------------------------------------
   DASHBOARD
-------------------------------------------------- */

function updateDashboard() {

    const assets =
        getAssets();


    const family =
        getFamilyData();


    const heirCount =
        [
            family.husband,
            family.wives,
            family.sons,
            family.daughters,
            family.father,
            family.mother,
            family.paternalGrandfather,
            family.maternalGrandmother,
            family.fullBrothers,
            family.fullSisters,
            family.maternalSiblings,
            family.sonGrandchildren
        ]
        .filter(value => Boolean(value))
        .length;


    const actions =
        buildActions();


    $("assetCount").textContent =
        assets.length;


    $("heirCount").textContent =
        heirCount;


    $("openActionCount").textContent =
        actions.length;


    $("reviewFlagCount").textContent =
        currentCase.faraidResult
            ? currentCase.faraidResult.reviewFlags.length
            : 0;


    const status =
        actions.length === 0
            ? "Ready for completion"
            : currentCase.faraidResult
                ? "Under review"
                : "Planning";


    $("caseStatus").textContent =
        status;


    renderProgress();

}


/* --------------------------------------------------
   PROGRESS
-------------------------------------------------- */

function renderProgress() {

    const checks =
        collectChecks([
            "ownership",
            "jointOwnership",
            "assetSearch",
            "debts",
            "funeral",
            "wasiyyah",
            "scholarReview",
            "settlementAgreement",
            "legalTransfer"
        ]);


    const labels = [

        {
            name: "Estate",

            complete:
                getAssets().length > 0
        },

        {
            name: "Obligations",

            complete:
                checks.debts &&
                checks.funeral &&
                checks.wasiyyah
        },

        {
            name: "Heirs",

            complete:
                Object.values(
                    getFamilyData()
                ).some(Boolean)
        },

        {
            name: "Faraid",

            complete:
                Boolean(
                    currentCase.faraidResult
                )
        },

        {
            name: "Property",

            complete:
                getPropertyPlans().length > 0
        },

        {
            name: "Actions",

            complete:
                buildActions().length === 0
        },

        {
            name: "Agreement",

            complete:
                checks.settlementAgreement
        },

        {
            name: "Legal",

            complete:
                checks.legalTransfer
        }

    ];


    $("progress").innerHTML =
        labels.map((stage, index) => `

            <div class="
                progress-item
                ${stage.complete ? "complete" : "active"}
            ">

                ${index + 1}.
                ${escapeHTML(stage.name)}

            </div>

        `).join("");

}


/* --------------------------------------------------
   BLUEPRINT
-------------------------------------------------- */

function createBlueprint() {

    currentCase =
        collectCaseFromUI();


    const actions =
        buildActions();


    $("blueprintOutput").innerHTML =
        generateBlueprint(
            currentCase,
            actions
        );

}


/* --------------------------------------------------
   SAVE
-------------------------------------------------- */

function handleSave() {

    currentCase =
        collectCaseFromUI();


    saveCase(
        currentCase
    );


    alert(
        "Case saved successfully in this browser."
    );


    updateDashboard();

}


/* --------------------------------------------------
   LOAD
-------------------------------------------------- */

function handleLoad() {

    const saved =
        loadCase();


    if (!saved) {

        alert(
            "No saved case was found in this browser."
        );

        return;

    }


    currentCase =
        saved;


    applyCaseToUI(
        saved
    );


    updateDashboard();

    renderActions();


    if (saved.faraidResult) {

        renderFaraidResult(
            saved.faraidResult
        );

    }


    alert(
        "Saved case loaded successfully."
    );

}


/* --------------------------------------------------
   APPLY SAVED CASE
-------------------------------------------------- */

function applyCaseToUI(data) {

    $("caseName").value =
        data.caseName || "";


    $("deceasedName").value =
        data.deceased?.name || "";


    $("deathDate").value =
        data.deceased?.deathDate || "";


    $("jurisdiction").value =
        data.deceased?.jurisdiction || "";


    $("administrator").value =
        data.deceased?.administrator || "";


    $("debts").value =
        data.obligations?.debts || "";


    $("funeralExpenses").value =
        data.obligations?.funeralExpenses || "";


    $("wasiyyah").value =
        data.obligations?.wasiyyah || "";


    const family =
        data.family || {};


    setSelect(
        "husband",
        family.husband
    );


    setValue(
        "wives",
        family.wives
    );


    setValue(
        "sons",
        family.sons
    );


    setValue(
        "daughters",
        family.daughters
    );


    setSelect(
        "father",
        family.father
    );


    setSelect(
        "mother",
        family.mother
    );


    setSelect(
        "paternalGrandfather",
        family.paternalGrandfather
    );


    setSelect(
        "maternalGrandmother",
        family.maternalGrandmother
    );


    setValue(
        "fullBrothers",
        family.fullBrothers
    );


    setValue(
        "fullSisters",
        family.fullSisters
    );


    setValue(
        "maternalSiblings",
        family.maternalSiblings
    );


    setSelect(
        "sonGrandchildren",
        family.sonGrandchildren
    );


    $("settlementNotes").value =
        data.settlement?.notes || "";


    $("scholarReviewer").value =
        data.settlement?.scholarReviewer || "";


    $("legalReviewer").value =
        data.settlement?.legalReviewer || "";


    applyChecks(
        data.ownershipChecks || {}
    );


    applyChecks(
        data.completionChecks || {}
    );


    $("assetsContainer").innerHTML =
        "";


    assetCounter = 0;


    (data.estate?.assets || [])
        .forEach(addAsset);


    $("propertyPlansContainer").innerHTML =
        "";


    propertyCounter = 0;


    (data.propertyPlans || [])
        .forEach(addPropertyPlan);

}


function setValue(id, value) {

    if ($(id)) {

        $(id).value =
            value ?? 0;

    }

}


function setSelect(id, value) {

    if ($(id)) {

        $(id).value =
            value ? "1" : "0";

    }

}


/* --------------------------------------------------
   NEW CASE
-------------------------------------------------- */

function handleNewCase() {

    const confirmed =
        confirm(
            "Start a new case? Unsaved information will be cleared."
        );


    if (!confirmed) {
        return;
    }


    deleteSavedCase();


    currentCase =
        createEmptyCase();


    location.reload();

}


/* --------------------------------------------------
   EVENT LISTENERS
-------------------------------------------------- */

$("addAssetBtn")
    .addEventListener(
        "click",
        () => addAsset()
    );


$("addPropertyPlanBtn")
    .addEventListener(
        "click",
        () => addPropertyPlan()
    );


$("determineFaraidBtn")
    .addEventListener(
        "click",
        determineFaraid
    );


$("saveCaseBtn")
    .addEventListener(
        "click",
        handleSave
    );


$("loadCaseBtn")
    .addEventListener(
        "click",
        handleLoad
    );


$("loadCaseHeroBtn")
    .addEventListener(
        "click",
        handleLoad
    );


$("newCaseBtn")
    .addEventListener(
        "click",
        handleNewCase
    );


$("generateBlueprintBtn")
    .addEventListener(
        "click",
        createBlueprint
    );


$("printBlueprintBtn")
    .addEventListener(
        "click",
        () => window.print()
    );


document.addEventListener(
    "click",
    event => {

        if (
            event.target.classList.contains(
                "remove-asset"
            )
        ) {

            event.target
                .closest(".asset-row")
                .remove();

            updateDashboard();
            renderActions();

        }


        if (
            event.target.classList.contains(
                "remove-property"
            )
        ) {

            event.target
                .closest(".property-row")
                .remove();

            updateDashboard();
            renderActions();

        }

    }
);


document.addEventListener(
    "input",
    () => {

        currentCase =
            collectCaseFromUI();

        updateDashboard();
        renderActions();

    }
);


document.addEventListener(
    "change",
    () => {

        currentCase =
            collectCaseFromUI();

        updateDashboard();
        renderActions();

    }
);


/* --------------------------------------------------
   INITIALISE
-------------------------------------------------- */

addAsset();

addPropertyPlan();

updateDashboard();

renderActions();
