/*
 * Blueprint Generator
 *
 * Converts structured case data into printable HTML.
 */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/**
 * Create a list of assets.
 */
function renderAssets(assets = []) {

    if (!assets.length) {

        return `
            <p class="muted">
                No estate assets recorded.
            </p>
        `;

    }


    return `
        <ul class="blueprint-list">
            ${assets.map(asset => `
                <li>
                    <strong>
                        ${escapeHTML(asset.name || "Unnamed asset")}
                    </strong>

                    — ${escapeHTML(asset.type || "Other")}

                    ${asset.notes
                        ? ` — ${escapeHTML(asset.notes)}`
                        : ""
                    }
                </li>
            `).join("")}
        </ul>
    `;
}


/**
 * Render Faraid result.
 */
function renderFaraidResult(result) {

    if (!result) {

        return `
            <p class="muted">
                Faraid framework has not yet been determined.
            </p>
        `;

    }


    const eligible =
        result.eligible || [];


    const excluded =
        result.excluded || [];


    const reviewFlags =
        result.reviewFlags || [];


    return `

        <h4>
            Eligible / Supported Heirs
        </h4>

        ${
            eligible.length
                ? `
                    <ul class="blueprint-list">
                        ${eligible.map(item => `
                            <li>
                                <strong>
                                    ${escapeHTML(item.heir)}
                                </strong>

                                — ${escapeHTML(item.share)}

                                — ${escapeHTML(item.reason)}
                            </li>
                        `).join("")}
                    </ul>
                `
                : `
                    <p>
                        No supported entitlement recorded.
                    </p>
                `
        }


        ${
            excluded.length
                ? `
                    <h4>
                        Excluded / Flagged Heirs
                    </h4>

                    <ul class="blueprint-list">
                        ${excluded.map(item => `
                            <li>
                                <strong>
                                    ${escapeHTML(item.heir)}
                                </strong>

                                — ${escapeHTML(item.reason)}
                            </li>
                        `).join("")}
                    </ul>
                `
                : ""
        }


        ${
            reviewFlags.length
                ? `
                    <div class="notice notice-warning">

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
                `
                : ""
        }

    `;
}


/**
 * Render property plans.
 */
function renderPropertyPlans(plans = []) {

    if (!plans.length) {

        return `
            <p class="muted">
                No property allocation plan recorded.
            </p>
        `;

    }


    return `
        <ul class="blueprint-list">
            ${plans.map(plan => `
                <li>
                    <strong>
                        ${escapeHTML(plan.property)}
                    </strong>

                    → ${escapeHTML(plan.method)}

                    ${
                        plan.notes
                            ? ` — ${escapeHTML(plan.notes)}`
                            : ""
                    }
                </li>
            `).join("")}
        </ul>
    `;
}


/**
 * Render outstanding actions.
 */
function renderActions(actions = []) {

    if (!actions.length) {

        return `
            <p>
                No outstanding actions recorded.
            </p>
        `;

    }


    return `
        <ul class="blueprint-list">
            ${actions.map(action => `
                <li>
                    ${escapeHTML(action.title)}
                    — ${escapeHTML(action.description)}
                </li>
            `).join("")}
        </ul>
    `;
}


/**
 * Main blueprint generator.
 */
export function generateBlueprint(caseData, actions = []) {

    const deceased =
        caseData.deceased || {};


    const obligations =
        caseData.obligations || {};


    const settlement =
        caseData.settlement || {};


    return `

        <div class="blueprint-header">

            <div class="eyebrow">
                FARAID ESTATE DISTRIBUTION BLUEPRINT
            </div>

            <h2 class="blueprint-title">
                ${escapeHTML(
                    caseData.caseName ||
                    `Estate of ${deceased.name || "Unknown"}`
                )}
            </h2>

            <p>
                Generated:
                ${new Date().toLocaleString()}
            </p>

        </div>


        <div class="blueprint-stage">

            <h3>
                1. Deceased Information
            </h3>

            <p>
                <strong>Name:</strong>
                ${escapeHTML(deceased.name || "Not recorded")}
            </p>

            <p>
                <strong>Date of death:</strong>
                ${escapeHTML(deceased.deathDate || "Not recorded")}
            </p>

            <p>
                <strong>Jurisdiction:</strong>
                ${escapeHTML(deceased.jurisdiction || "Not recorded")}
            </p>

            <p>
                <strong>Administrator:</strong>
                ${escapeHTML(deceased.administrator || "Not recorded")}
            </p>

        </div>


        <div class="blueprint-stage">

            <h3>
                2. Estate Inventory
            </h3>

            ${renderAssets(
                caseData.estate?.assets || []
            )}

        </div>


        <div class="blueprint-stage">

            <h3>
                3. Prior Obligations
            </h3>

            <p>
                <strong>Debts:</strong>
                ${escapeHTML(
                    obligations.debts ||
                    "Not recorded"
                )}
            </p>

            <p>
                <strong>Funeral / burial:</strong>
                ${escapeHTML(
                    obligations.funeralExpenses ||
                    "Not recorded"
                )}
            </p>

            <p>
                <strong>Wasiyyah:</strong>
                ${escapeHTML(
                    obligations.wasiyyah ||
                    "Not recorded"
                )}
            </p>

        </div>


        <div class="blueprint-stage">

            <h3>
                4. Faraid Framework
            </h3>

            ${renderFaraidResult(
                caseData.faraidResult
            )}

        </div>


        <div class="blueprint-stage">

            <h3>
                5. Property Allocation
            </h3>

            ${renderPropertyPlans(
                caseData.propertyPlans || []
            )}

        </div>


        <div class="blueprint-stage">

            <h3>
                6. Family Settlement
            </h3>

            <p>
                ${escapeHTML(
                    settlement.notes ||
                    "No settlement recorded."
                )}
            </p>

            <p>
                <strong>Islamic scholar:</strong>
                ${escapeHTML(
                    settlement.scholarReviewer ||
                    "Not recorded"
                )}
            </p>

            <p>
                <strong>Legal adviser:</strong>
                ${escapeHTML(
                    settlement.legalReviewer ||
                    "Not recorded"
                )}
            </p>

        </div>


        <div class="blueprint-stage">

            <h3>
                7. Outstanding Actions
            </h3>

            ${renderActions(actions)}

        </div>


        <div class="blueprint-stage">

            <div class="notice notice-warning">

                <strong>
                    Professional Review Notice
                </strong>

                <p>
                    This blueprint is a planning document.
                    It does not constitute a fatwa, legal opinion
                    or final inheritance determination.
                    Complex cases should be reviewed by a qualified
                    Islamic scholar and appropriate legal professional.
                </p>

            </div>

        </div>

    `;
}
