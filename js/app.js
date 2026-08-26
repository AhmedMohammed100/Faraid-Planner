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


/* =========================================================
   APPLICATION STATE
========================================================= */

let currentCase = createEmptyCase();

let assetCounter = 0;
let propertyCounter = 0;


/* =========================================================
   DOM HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function getValue(id, fallback = "") {

    const element = $(id);

    if (!element) {
        return fallback;
    }

    return element.value ?? fallback;
}


function setElementText(id, value) {

    const element = $(id);

    if (element) {
        element.textContent = value ?? "";
    }
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   FRACTION DISPLAY HELPERS
========================================================= */

function fractionDisplay(value) {

    if (
        !value ||
        typeof value !== "object" ||
        value.numerator === undefined ||
        value.denominator === undefined
    ) {
        return "—";
    }

    return `${value.numerator}/${value.denominator}`;
}


function fractionDecimalDisplay(value) {

    if (
        !value ||
        typeof value !== "object" ||
        !Number.isFinite(Number(value.numerator)) ||
        !Number.isFinite(Number(value.denominator)) ||
        Number(value.denominator) === 0
    ) {
        return "";
    }

    return (
        Number(value.numerator) /
        Number(value.denominator)
    ).toFixed(6);
}


/* =========================================================
   ASSET MANAGEMENT
========================================================= */

function addAsset(asset = {}) {

    const container = $("assetsContainer");

    if (!container) {
        console.warn(
            "Faraid Planner: #assetsContainer not found."
        );
        return;
    }

    assetCounter++;

    const row = document.createElement("div");

    row.className = "asset-row";

    row.dataset.assetId = assetCounter;

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

    container.appendChild(row);


    if (asset.type) {

        const select =
            row.querySelector(".asset-type");

        if (select) {
            select.value = asset.type;
        }
    }
}


function getAssets() {

    return [
        ...document.querySelectorAll(".asset-row")
    ]
        .map(row => {

            const name =
                row.querySelector(".asset-name");

            const type =
                row.querySelector(".asset-type");

            const notes =
                row.querySelector(".asset-notes");

            return {

                name:
                    name
                        ? name.value.trim()
                        : "",

                type:
                    type
                        ? type.value
                        : "Other",

                notes:
                    notes
                        ? notes.value.trim()
                        : ""

            };

        })
        .filter(asset =>
            asset.name ||
            asset.notes
        );
}


/* =========================================================
   PROPERTY ALLOCATION PLANS
========================================================= */

function addPropertyPlan(plan = {}) {

    const container =
        $("propertyPlansContainer");

    if (!container) {
        console.warn(
            "Faraid Planner: #propertyPlansContainer not found."
        );
        return;
    }

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

    container.appendChild(row);


    if (plan.method) {

        const method =
            row.querySelector(".property-method");

        if (method) {
            method.value = plan.method;
        }
    }
}


function getPropertyPlans() {

    return [
        ...document.querySelectorAll(
            ".property-row"
        )
    ]
        .map(row => {

            const property =
                row.querySelector(
                    ".property-name"
                );

            const method =
                row.querySelector(
                    ".property-method"
                );

            const notes =
                row.querySelector(
                    ".property-notes"
                );

            return {

                property:
                    property
                        ? property.value.trim()
                        : "",

                method:
                    method
                        ? method.value
                        : "Pending review",

                notes:
                    notes
                        ? notes.value.trim()
                        : ""

            };

        })
        .filter(plan =>
            plan.property ||
            plan.notes
        );
}


/* =========================================================
   FAMILY INPUT
========================================================= */

function isYes(id) {

    const element = $(id);

    if (!element) {
        return false;
    }

    return element.value === "1";
}


function getNumber(id) {

    const element = $(id);

    if (!element) {
        return 0;
    }

    const value =
        Number(element.value);

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


/* =========================================================
   CASE COLLECTION
========================================================= */

function collectCaseFromUI() {

    const data =
        createEmptyCase();


    data.caseName =
        getValue("caseName");


    data.deceased = {

        name:
            getValue("deceasedName"),

        deathDate:
            getValue("deathDate"),

        jurisdiction:
            getValue("jurisdiction"),

        administrator:
            getValue("administrator")

    };


    data.estate = {

        assets:
            getAssets()

    };


    data.obligations = {

        debts:
            getValue("debts"),

        funeralExpenses:
            getValue("funeralExpenses"),

        wasiyyah:
            getValue("wasiyyah")

    };


    data.family =
        getFamilyData();


    data.propertyPlans =
        getPropertyPlans();


    data.settlement = {

        notes:
            getValue("settlementNotes"),

        scholarReviewer:
            getValue("scholarReviewer"),

        legalReviewer:
            getValue("legalReviewer")

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


    /*
     * Preserve the latest calculated result.
     *
     * This is deliberately copied from currentCase rather
     * than creating a new result automatically.
     */

    data.faraidResult =
        currentCase.faraidResult || null;


    return data;
}


/* =========================================================
   CHECKBOXES
========================================================= */

function collectChecks(names) {

    const result = {};

    names.forEach(name => {

        const element =
            document.querySelector(
                `[data-check="${name}"]`
            );

        result[name] =
            element
                ? Boolean(element.checked)
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


/* =========================================================
   FARAID FAMILY FIELD IDENTIFIERS
========================================================= */

const FARAID_FIELD_IDS = new Set([

    "husband",
    "wives",
    "sons",
    "daughters",
    "father",
    "mother",
    "paternalGrandfather",
    "maternalGrandmother",
    "fullBrothers",
    "fullSisters",
    "maternalSiblings",
    "sonGrandchildren"

]);


function invalidateFaraidResult() {

    if (!currentCase.faraidResult) {
        return;
    }

    currentCase.faraidResult = null;

    const resultContainer =
        $("faraidResult");

    if (resultContainer) {

        resultContainer.innerHTML = `

            <div class="notice notice-warning">

                <strong>
                    Faraid result needs to be recalculated.
                </strong>

                <p>
                    The surviving-heir information has changed.
                    Click <strong>Determine Faraid Framework</strong>
                    to calculate the updated entitlement.
                </p>

            </div>

        `;
    }
}


/* =========================================================
   FARAID CALCULATION
========================================================= */

function determineFaraid() {

    const resultContainer =
        $("faraidResult");

    if (!resultContainer) {

        throw new Error(
            "The Faraid result container (#faraidResult) could not be found."
        );
    }


    const family =
        getFamilyData();


    /*
     * Basic sanity check.
     */

    const spouseCount =
        (family.husband ? 1 : 0) +
        family.wives;


    if (spouseCount > 1) {

        /*
         * Husband and wives cannot both describe the deceased's
         * surviving spouse configuration.
         */

        throw new Error(
            "The family information contains both a husband and one or more wives. Please correct the spouse information."
        );
    }


    console.log(
        "Faraid input:",
        family
    );


    const result =
        calculateFaraid(
            family
        );


    if (!result) {

        throw new Error(
            "The Faraid engine returned no result."
        );
    }


    console.log(
        "Faraid result:",
        result
    );


    currentCase =
        collectCaseFromUI();


    currentCase.faraidResult =
        result;


    renderFaraidResult(
        result
    );


    updateDashboard();

    renderActions();


    resultContainer.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* =========================================================
   FARAID RESULT RENDERING
========================================================= */

function renderFaraidResult(result) {

    const resultContainer =
        $("faraidResult");

    if (!resultContainer) {
        return;
    }


    if (!result) {

        resultContainer.innerHTML = "";

        return;
    }


    const eligible =
        Array.isArray(result.eligible)
            ? result.eligible
            : [];


    const excluded =
        Array.isArray(result.excluded)
            ? result.excluded
            : [];


    const reviewFlags =
        Array.isArray(result.reviewFlags)
            ? result.reviewFlags
            : [];


    const calculation =
        result.shareCalculation || null;


    const statusClass =
        result.status ===
            "supported-common-framework"
            ? "status-supported"
            : "status-review";


    let html = `

        <div class="card faraid-result-card">

            <div class="faraid-result-header">

                <div>

                    <div class="eyebrow">
                        STAGE 4
                    </div>

                    <h3>
                        Faraid Framework Result
                    </h3>

                    <p class="muted">
                        Eligibility, governing rule, exact fractional
                        entitlement and distribution instructions.
                    </p>

                </div>

                <span class="
                    faraid-status
                    ${statusClass}
                ">
                    ${escapeHTML(
                        result.status ||
                        "Review required"
                    )}
                </span>

            </div>

    `;


    /* =====================================================
       ELIGIBLE HEIRS
    ===================================================== */

    if (eligible.length) {

        html += `

            <h4 class="faraid-subheading">
                Eligible / Supported Heirs
            </h4>

            <div class="table-wrapper faraid-table-wrapper">

                <table class="faraid-table">

                    <thead>

                        <tr>

                            <th>
                                Heir
                            </th>

                            <th>
                                Eligibility
                            </th>

                            <th>
                                Rule (Source)
                            </th>

                            <th>
                                Classification
                            </th>

                            <th>
                                Exact Fractional Entitlement
                            </th>

                            <th>
                                Distribution Instructions
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${eligible.map(item => {

                            let exactShare =
                                item.fraction
                                    ? fractionDisplay(
                                        item.fraction
                                    )
                                    : (
                                        item.share ||
                                        "Residue"
                                    );


                            let instruction =
                                "Participates in the applicable inheritance distribution rule.";


                            /*
                             * Fixed share.
                             */

                            if (
                                item.category === "fixed" &&
                                item.fraction
                            ) {

                                instruction =
                                    `Allocate ${escapeHTML(
                                        fractionDisplay(
                                            item.fraction
                                        )
                                    )} of the distributable estate to ${escapeHTML(
                                        String(
                                            item.heir ||
                                            "this heir"
                                        ).toLowerCase()
                                    )}.`;
                            }


                            /*
                             * Sons in residuary distribution.
                             */

                            if (
                                item.heir === "Sons" &&
                                calculation &&
                                calculation.residuary
                            ) {

                                const residuary =
                                    calculation.residuary;


                                if (
                                    residuary.sons >
                                    0
                                ) {

                                    exactShare =
                                        `${fractionDisplay(
                                            residuary.sonsCollective
                                        )} collectively`;


                                    instruction =
                                        `Remainder after fixed shares. Divide the sons' collective entitlement equally between ${item.count || residuary.sons} sons. Each son receives ${fractionDisplay(
                                            residuary.individualSonShare
                                        )}.`;
                                }
                            }


                            /*
                             * Daughters with sons.
                             */

                            if (
                                item.heir ===
                                    "Daughters with sons" &&
                                calculation &&
                                calculation.residuary
                            ) {

                                const residuary =
                                    calculation.residuary;


                                if (
                                    residuary.daughters >
                                    0
                                ) {

                                    exactShare =
                                        `${fractionDisplay(
                                            residuary.daughtersCollective
                                        )} collectively`;


                                    instruction =
                                        `Remainder after fixed shares. Each daughter receives one unit for every two units allocated to a son. Each daughter receives ${fractionDisplay(
                                            residuary.individualDaughterShare
                                        )}.`;
                                }
                            }


                            /*
                             * Residuary item without a detailed calculation.
                             */

                            if (
                                item.category ===
                                    "residuary" &&
                                !calculation?.residuary
                            ) {

                                exactShare =
                                    item.share ||
                                    "Residue";

                                instruction =
                                    "Receives the applicable residuary entitlement after fixed shares.";
                            }


                            return `

                                <tr>

                                    <td>

                                        <strong>
                                            ${escapeHTML(
                                                item.heir ||
                                                "Unnamed heir"
                                            )}
                                        </strong>

                                        ${
                                            item.count > 1
                                                ? `
                                                    <br>
                                                    <small>
                                                        ${item.count}
                                                        persons
                                                    </small>
                                                `
                                                : ""
                                        }

                                    </td>


                                    <td>

                                        <span class="
                                            badge
                                            badge-eligible
                                        ">
                                            Eligible
                                        </span>

                                    </td>


                                    <td>

                                        <div class="rule-cell">

                                            <strong>
                                                ${
                                                    item.category ===
                                                        "fixed"
                                                        ? "Qur'anic fixed share"
                                                        : "Residuary rule"
                                                }
                                            </strong>

                                            <small>
                                                ${escapeHTML(
                                                    item.source ||
                                                    item.reason ||
                                                    "Applicable Faraid rule"
                                                )}
                                            </small>

                                        </div>

                                    </td>


                                    <td>

                                        <span class="
                                            badge
                                            ${
                                                item.category ===
                                                    "fixed"
                                                    ? "badge-fixed"
                                                    : "badge-residuary"
                                            }
                                        ">

                                            ${
                                                item.category ===
                                                    "fixed"
                                                    ? "Fixed Share"
                                                    : "Residuary"
                                            }

                                        </span>

                                    </td>


                                    <td>

                                        <strong class="exact-share">

                                            ${escapeHTML(
                                                exactShare
                                            )}

                                        </strong>

                                        ${
                                            item.fraction
                                                ? `
                                                    <small class="decimal-share">
                                                        (
                                                        ${fractionDecimalDisplay(
                                                            item.fraction
                                                        )}
                                                        )
                                                    </small>
                                                `
                                                : ""
                                        }

                                    </td>


                                    <td>

                                        ${instruction}

                                    </td>

                                </tr>

                            `;

                        }).join("")}

                    </tbody>

                </table>

            </div>

        `;

    } else {

        html += `

            <div class="notice notice-warning">

                <strong>
                    No supported eligible heirs were identified.
                </strong>

                <p>
                    Review the surviving-family information and
                    any specialist-review flags.
                </p>

            </div>

        `;

    }


    /* =====================================================
       SHARE CALCULATION
    ===================================================== */

    if (calculation) {

        const fixedShares =
            Array.isArray(
                calculation.fixedShares
            )
                ? calculation.fixedShares
                : [];


        const residuary =
            calculation.residuary || null;


        html += `

            <div class="share-calculation">

                <h4 class="faraid-subheading">
                    Share Calculation
                </h4>

                <div class="calculation-flow">

                    <div class="calculation-card">

                        <div class="calculation-card-header">
                            Step 1: Fixed Shares
                        </div>

                        <div class="calculation-card-body">

                            ${
                                fixedShares.length

                                    ? fixedShares
                                        .map(item => `

                                            <div class="calculation-line">

                                                <span>
                                                    ${escapeHTML(
                                                        item.heir ||
                                                        "Heir"
                                                    )}
                                                </span>

                                                <strong>
                                                    ${fractionDisplay(
                                                        item.fraction
                                                    )}
                                                </strong>

                                            </div>

                                        `)
                                        .join("")

                                    : `

                                        <div class="muted">
                                            No fixed shares recorded.
                                        </div>

                                    `
                            }


                            <div class="calculation-line calculation-total">

                                <span>
                                    Total Fixed Shares
                                </span>

                                <strong>
                                    ${fractionDisplay(
                                        calculation.totalFixedShares
                                    )}
                                </strong>

                            </div>

                        </div>

                    </div>


                    <div class="calculation-arrow">
                        →
                    </div>


                    <div class="calculation-card">

                        <div class="calculation-card-header">
                            Step 2: Remainder
                        </div>

                        <div class="calculation-card-body">

                            <div class="calculation-line">

                                <span>
                                    Estate (Whole)
                                </span>

                                <strong>
                                    ${fractionDisplay(
                                        calculation.whole
                                    )}
                                </strong>

                            </div>


                            <div class="calculation-line">

                                <span>
                                    Minus Fixed Shares
                                </span>

                                <strong>
                                    ${fractionDisplay(
                                        calculation.totalFixedShares
                                    )}
                                </strong>

                            </div>


                            <div class="calculation-line calculation-total">

                                <span>
                                    Remainder
                                </span>

                                <strong>
                                    ${fractionDisplay(
                                        calculation.remainder
                                    )}
                                </strong>

                            </div>

                        </div>

                    </div>


                    ${
                        residuary

                            ? `

                                <div class="calculation-arrow">
                                    →
                                </div>


                                <div class="calculation-card">

                                    <div class="calculation-card-header">
                                        Step 3: Residuary Distribution
                                    </div>

                                    <div class="calculation-card-body">

                                        <div class="calculation-line">

                                            <span>
                                                Residuary to be distributed
                                            </span>

                                            <strong>
                                                ${fractionDisplay(
                                                    residuary.residue
                                                )}
                                            </strong>

                                        </div>


                                        <div class="calculation-line">

                                            <span>
                                                Units
                                                (
                                                ${residuary.sons || 0}
                                                sons × 2
                                                )
                                                +
                                                (
                                                ${residuary.daughters || 0}
                                                daughters × 1
                                                )
                                            </span>

                                            <strong>
                                                ${escapeHTML(
                                                    residuary.units ??
                                                    "—"
                                                )}
                                                units
                                            </strong>

                                        </div>


                                        <div class="calculation-line calculation-total">

                                            <span>
                                                Value per Unit
                                            </span>

                                            <strong>
                                                ${fractionDisplay(
                                                    residuary.valuePerUnit
                                                )}
                                            </strong>

                                        </div>


                                        <div class="calculation-explanation">

                                            Each son receives two units.
                                            Each daughter receives one unit.

                                        </div>

                                    </div>

                                </div>


                                <div class="calculation-arrow">
                                    →
                                </div>


                                <div class="calculation-card">

                                    <div class="calculation-card-header">
                                        Step 4: Final Entitlements
                                    </div>

                                    <div class="calculation-card-body">

                                        ${
                                            residuary.sons > 0

                                                ? `

                                                    <div class="calculation-line">

                                                        <span>
                                                            Each Son
                                                        </span>

                                                        <strong>
                                                            ${fractionDisplay(
                                                                residuary
                                                                    .individualSonShare
                                                            )}
                                                        </strong>

                                                    </div>

                                                `

                                                : ""
                                        }


                                        ${
                                            residuary.daughters > 0

                                                ? `

                                                    <div class="calculation-line">

                                                        <span>
                                                            Each Daughter
                                                        </span>

                                                        <strong>
                                                            ${fractionDisplay(
                                                                residuary
                                                                    .individualDaughterShare
                                                            )}
                                                        </strong>

                                                    </div>

                                                `

                                                : ""
                                        }


                                        <div class="calculation-line calculation-total">

                                            <span>
                                                Total Distributed
                                            </span>

                                            <strong>
                                                ${fractionDisplay(
                                                    calculation.totalDistributed
                                                )}
                                            </strong>

                                        </div>

                                    </div>

                                </div>

                            `

                            : `

                                <div class="calculation-arrow">
                                    →
                                </div>

                                <div class="calculation-card">

                                    <div class="calculation-card-header">
                                        Remaining Estate
                                    </div>

                                    <div class="calculation-card-body">

                                        <div class="calculation-line calculation-total">

                                            <span>
                                                Remainder
                                            </span>

                                            <strong>
                                                ${fractionDisplay(
                                                    calculation.remainder
                                                )}
                                            </strong>

                                        </div>

                                    </div>

                                </div>

                            `
                    }

                </div>

            </div>

        `;

    }


    /* =====================================================
       EXCLUDED HEIRS
    ===================================================== */

    if (excluded.length) {

        html += `

            <div class="excluded-section">

                <h4 class="faraid-subheading">
                    Excluded Heirs
                </h4>

                <div class="table-wrapper">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Heir
                                </th>

                                <th>
                                    Reason
                                </th>

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

                                            ${escapeHTML(
                                                item.heir ||
                                                "Heir"
                                            )}

                                        </span>

                                    </td>

                                    <td>

                                        ${escapeHTML(
                                            item.reason ||
                                            "Excluded under the applicable rule."
                                        )}

                                    </td>

                                </tr>

                            `).join("")}

                        </tbody>

                    </table>

                </div>

            </div>

        `;

    }


    /* =====================================================
       REVIEW FLAGS
    ===================================================== */

    if (reviewFlags.length) {

        html += `

            <div class="
                notice
                notice-warning
                faraid-review-notice
            ">

                <strong>
                    Specialist Review Required
                </strong>

                <ul>

                    ${reviewFlags.map(flag => `

                        <li>
                            ${escapeHTML(
                                flag.message ||
                                flag.code ||
                                "Specialist review required."
                            )}
                        </li>

                    `).join("")}

                </ul>

            </div>

        `;

    }


    /* =====================================================
       IMPORTANT DISCLAIMER
    ===================================================== */

    html += `

        <div class="
            notice
            notice-info
            faraid-important
        ">

            <strong>
                Important:
            </strong>

            This is a Faraid framework, not a final legal
            or scholarly determination. Fractions refer to
            the distributable estate after applicable debts,
            funeral/burial expenses and valid obligations
            have been settled.

        </div>


        <details class="faraid-notes">

            <summary>
                Notes & Disclaimers
            </summary>

            <div class="faraid-notes-body">

                <p>
                    The system is designed to establish a
                    structured inheritance framework and
                    property-distribution blueprint.
                </p>

                <p>
                    It does not replace a qualified Islamic
                    scholar, estate administrator, lawyer,
                    court or other competent authority.
                </p>

                <p>
                    Complex cases are deliberately flagged
                    for specialist review rather than being
                    silently resolved.
                </p>

            </div>

        </details>

    </div>

    `;


    resultContainer.innerHTML =
        html;
}


/* =========================================================
   ACTION TRACKER
========================================================= */

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


    const faraidResult =
        currentCase.faraidResult;


    if (!faraidResult) {

        actions.push({

            status: "open",

            title:
                "Determine Faraid framework",

            description:
                "Complete the surviving-heir information and run the Faraid engine."

        });

    }


    if (
        faraidResult &&
        Array.isArray(
            faraidResult.reviewFlags
        ) &&
        faraidResult.reviewFlags.length
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

    const container =
        $("actionsList");

    if (!container) {
        return;
    }


    const actions =
        buildActions();


    if (!actions.length) {

        container.innerHTML = `

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


    container.innerHTML = `

        <div class="action-list">

            ${actions.map(action => {

                const statusClass =
                    action.status === "review"
                        ? "review"
                        : action.status === "open"
                            ? "excluded"
                            : "residuary";


                return `

                    <div class="action-item">

                        <span class="
                            action-dot
                            ${escapeHTML(
                                action.status
                            )}
                        "></span>

                        <div>

                            <h4>
                                ${escapeHTML(
                                    action.title
                                )}
                            </h4>

                            <p>
                                ${escapeHTML(
                                    action.description
                                )}
                            </p>

                        </div>

                        <span class="
                            action-status
                            badge-${statusClass}
                        ">
                            ${escapeHTML(
                                action.status.toUpperCase()
                            )}
                        </span>

                    </div>

                `;

            }).join("")}

        </div>

    `;
}


/* =========================================================
   DASHBOARD
========================================================= */

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
        .filter(value =>
            Boolean(value)
        )
        .length;


    const actions =
        buildActions();


    setElementText(
        "assetCount",
        assets.length
    );


    setElementText(
        "heirCount",
        heirCount
    );


    setElementText(
        "openActionCount",
        actions.length
    );


    setElementText(
        "reviewFlagCount",

        currentCase.faraidResult &&
        Array.isArray(
            currentCase.faraidResult.reviewFlags
        )

            ? currentCase
                .faraidResult
                .reviewFlags
                .length

            : 0
    );


    const status =
        actions.length === 0

            ? "Ready for completion"

            : currentCase.faraidResult

                ? "Under review"

                : "Planning";


    setElementText(
        "caseStatus",
        status
    );


    renderProgress();
}


/* =========================================================
   PROGRESS
========================================================= */

function renderProgress() {

    const container =
        $("progress");

    if (!container) {
        return;
    }


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


    container.innerHTML =
        labels.map(
            (stage, index) => `

                <div class="
                    progress-item
                    ${stage.complete
                        ? "complete"
                        : "active"}
                ">

                    ${index + 1}.
                    ${escapeHTML(
                        stage.name
                    )}

                </div>

            `
        ).join("");
}


/* =========================================================
   BLUEPRINT
========================================================= */

function createBlueprint() {

    const output =
        $("blueprintOutput");

    if (!output) {

        throw new Error(
            "The Blueprint output container (#blueprintOutput) could not be found."
        );
    }


    currentCase =
        collectCaseFromUI();


    const actions =
        buildActions();


    output.innerHTML =
        generateBlueprint(
            currentCase,
            actions
        );


    output.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* =========================================================
   SAVE
========================================================= */

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

    renderActions();
}


/* =========================================================
   LOAD
========================================================= */

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


/* =========================================================
   APPLY SAVED CASE TO UI
========================================================= */

function applyCaseToUI(data = {}) {

    setFieldValue(
        "caseName",
        data.caseName
    );


    setFieldValue(
        "deceasedName",
        data.deceased?.name
    );


    setFieldValue(
        "deathDate",
        data.deceased?.deathDate
    );


    setFieldValue(
        "jurisdiction",
        data.deceased?.jurisdiction
    );


    setFieldValue(
        "administrator",
        data.deceased?.administrator
    );


    setFieldValue(
        "debts",
        data.obligations?.debts
    );


    setFieldValue(
        "funeralExpenses",
        data.obligations?.funeralExpenses
    );


    setFieldValue(
        "wasiyyah",
        data.obligations?.wasiyyah
    );


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


    setFieldValue(
        "settlementNotes",
        data.settlement?.notes
    );


    setFieldValue(
        "scholarReviewer",
        data.settlement?.scholarReviewer
    );


    setFieldValue(
        "legalReviewer",
        data.settlement?.legalReviewer
    );


    applyChecks(
        data.ownershipChecks || {}
    );


    applyChecks(
        data.completionChecks || {}
    );


    /*
     * Rebuild asset rows.
     */

    const assetsContainer =
        $("assetsContainer");

    if (assetsContainer) {

        assetsContainer.innerHTML =
            "";

        assetCounter = 0;


        const assets =
            Array.isArray(
                data.estate?.assets
            )
                ? data.estate.assets
                : [];


        assets.forEach(
            addAsset
        );


        /*
         * Always keep one empty row available.
         */

        if (!assets.length) {
            addAsset();
        }
    }


    /*
     * Rebuild property plan rows.
     */

    const propertyContainer =
        $("propertyPlansContainer");

    if (propertyContainer) {

        propertyContainer.innerHTML =
            "";

        propertyCounter = 0;


        const plans =
            Array.isArray(
                data.propertyPlans
            )
                ? data.propertyPlans
                : [];


        plans.forEach(
            addPropertyPlan
        );


        if (!plans.length) {
            addPropertyPlan();
        }
    }
}


function setFieldValue(id, value) {

    const element =
        $(id);

    if (element) {

        element.value =
            value ?? "";
    }
}


function setValue(id, value) {

    const element =
        $(id);

    if (element) {

        element.value =
            value ?? 0;
    }
}


function setSelect(id, value) {

    const element =
        $(id);

    if (element) {

        element.value =
            value
                ? "1"
                : "0";
    }
}


/* =========================================================
   NEW CASE
========================================================= */

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


/* =========================================================
   EVENT BINDING
========================================================= */

function bindClick(
    id,
    handler
) {

    const element =
        $(id);


    if (!element) {

        console.warn(
            `Faraid Planner: element #${id} was not found.`
        );

        return;
    }


    element.addEventListener(
        "click",
        event => {

            try {

                handler(event);

            } catch (error) {

                console.error(
                    `Faraid Planner error in #${id}:`,
                    error
                );


                showApplicationError(
                    error
                );
            }

        }
    );
}


/* =========================================================
   ERROR DISPLAY
========================================================= */

function showApplicationError(error) {

    console.error(
        "Faraid Planner application error:",
        error
    );


    const message =
        error?.message ||
        String(error);


    /*
     * Faraid errors go to the Faraid result area.
     */

    const faraidResult =
        $("faraidResult");


    if (
        faraidResult &&
        (
            message.toLowerCase().includes(
                "faraid"
            ) ||
            message.toLowerCase().includes(
                "heir"
            ) ||
            message.toLowerCase().includes(
                "spouse"
            )
        )
    ) {

        faraidResult.innerHTML = `

            <div class="
                notice
                notice-warning
            ">

                <strong>
                    Unable to calculate Faraid
                </strong>

                <p>
                    ${escapeHTML(
                        message
                    )}
                </p>

            </div>

        `;

        return;
    }


    /*
     * Otherwise use a simple alert.
     */

    alert(
        `Faraid Planner error: ${message}`
    );
}


/* =========================================================
   INITIAL APPLICATION SETUP
========================================================= */

function initialiseApplication() {

    console.log(
        "Faraid Planner: initialising..."
    );


    /* -----------------------------------------------------
       BUTTONS
    ----------------------------------------------------- */

    bindClick(
        "addAssetBtn",
        () => addAsset()
    );


    bindClick(
        "addPropertyPlanBtn",
        () => addPropertyPlan()
    );


    bindClick(
        "determineFaraidBtn",
        () => determineFaraid()
    );


    bindClick(
        "saveCaseBtn",
        () => handleSave()
    );


    bindClick(
        "loadCaseBtn",
        () => handleLoad()
    );


    bindClick(
        "loadCaseHeroBtn",
        () => handleLoad()
    );


    bindClick(
        "newCaseBtn",
        () => handleNewCase()
    );


    bindClick(
        "generateBlueprintBtn",
        () => createBlueprint()
    );


    bindClick(
        "printBlueprintBtn",
        () => window.print()
    );


    /* -----------------------------------------------------
       INITIAL ASSET / PROPERTY ROWS
    ----------------------------------------------------- */

    const assetsContainer =
        $("assetsContainer");


    if (
        assetsContainer &&
        !assetsContainer.querySelector(
            ".asset-row"
        )
    ) {

        addAsset();
    }


    const propertyContainer =
        $("propertyPlansContainer");


    if (
        propertyContainer &&
        !propertyContainer.querySelector(
            ".property-row"
        )
    ) {

        addPropertyPlan();
    }


    /* -----------------------------------------------------
       DYNAMIC REMOVE BUTTONS
    ----------------------------------------------------- */

    document.addEventListener(
        "click",
        event => {

            const target =
                event.target;


            if (!target) {
                return;
            }


            if (
                target.classList &&
                target.classList.contains(
                    "remove-asset"
                )
            ) {

                const row =
                    target.closest(
                        ".asset-row"
                    );


                if (row) {
                    row.remove();
                }


                updateDashboard();

                renderActions();

                return;
            }


            if (
                target.classList &&
                target.classList.contains(
                    "remove-property"
                )
            ) {

                const row =
                    target.closest(
                        ".property-row"
                    );


                if (row) {
                    row.remove();
                }


                updateDashboard();

                renderActions();

            }

        }
    );


    /* -----------------------------------------------------
       INPUT EVENTS
    ----------------------------------------------------- */

    document.addEventListener(
        "input",
        event => {

            try {

                const target =
                    event.target;


                /*
                 * If a family field changes, the old Faraid
                 * result is no longer valid.
                 */

                if (
                    target &&
                    target.id &&
                    FARAID_FIELD_IDS.has(
                        target.id
                    )
                ) {

                    invalidateFaraidResult();

                }


                currentCase =
                    collectCaseFromUI();


                updateDashboard();

                renderActions();

            } catch (error) {

                console.warn(
                    "Case input update warning:",
                    error
                );

            }

        }
    );


    /* -----------------------------------------------------
       CHANGE EVENTS
    ----------------------------------------------------- */

    document.addEventListener(
        "change",
        event => {

            try {

                const target =
                    event.target;


                if (
                    target &&
                    target.id &&
                    FARAID_FIELD_IDS.has(
                        target.id
                    )
                ) {

                    invalidateFaraidResult();

                }


                currentCase =
                    collectCaseFromUI();


                updateDashboard();

                renderActions();

            } catch (error) {

                console.warn(
                    "Case change update warning:",
                    error
                );

            }

        }
    );


    /* -----------------------------------------------------
       INITIAL STATE
    ----------------------------------------------------- */

    currentCase =
        collectCaseFromUI();


    updateDashboard();

    renderActions();


    console.log(
        "Faraid Planner: initialisation complete."
    );
}


/* =========================================================
   START APPLICATION
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialiseApplication,
        {
            once: true
        }
    );

} else {

    initialiseApplication();

}
