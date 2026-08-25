/*
 * Faraid Planner - Browser Storage
 *
 * Stores the user's inheritance case locally in the browser.
 * This file is deliberately separate from the Faraid calculation engine.
 */

export const STORAGE_VERSION = 1;
export const STORAGE_KEY = "faraid-planner-case-v1";


/**
 * Create a completely new empty inheritance case.
 */
export function createEmptyCase() {
    return {
        schemaVersion: STORAGE_VERSION,

        caseName: "",

        deceased: {
            name: "",
            deathDate: "",
            jurisdiction: "",
            administrator: ""
        },

        estate: {
            assets: []
        },

        obligations: {
            debts: "",
            funeralExpenses: "",
            wasiyyah: ""
        },

        family: {
            husband: false,
            wives: 0,

            sons: 0,
            daughters: 0,

            father: false,
            mother: false,

            paternalGrandfather: false,
            maternalGrandmother: false,

            fullBrothers: 0,
            fullSisters: 0,

            maternalSiblings: 0,

            sonGrandchildren: false
        },

        propertyPlans: [],

        settlement: {
            notes: "",
            scholarReviewer: "",
            legalReviewer: ""
        },

        ownershipChecks: {},

        completionChecks: {},

        faraidResult: null
    };
}


/**
 * Make sure imported or saved data has the expected structure.
 */
function normalizeCase(data) {

    const empty = createEmptyCase();

    if (!data || typeof data !== "object") {
        return empty;
    }

    return {
        ...empty,

        ...data,

        schemaVersion: STORAGE_VERSION,

        deceased: {
            ...empty.deceased,
            ...(data.deceased || {})
        },

        estate: {
            ...empty.estate,
            ...(data.estate || {}),

            assets: Array.isArray(data.estate?.assets)
                ? data.estate.assets
                : []
        },

        obligations: {
            ...empty.obligations,
            ...(data.obligations || {})
        },

        family: {
            ...empty.family,
            ...(data.family || {})
        },

        propertyPlans: Array.isArray(data.propertyPlans)
            ? data.propertyPlans
            : [],

        settlement: {
            ...empty.settlement,
            ...(data.settlement || {})
        },

        ownershipChecks: {
            ...(data.ownershipChecks || {})
        },

        completionChecks: {
            ...(data.completionChecks || {})
        },

        faraidResult: data.faraidResult || null
    };
}


/**
 * Save the current case in the user's browser.
 */
export function saveCase(caseData) {

    try {

        const normalized = normalizeCase(caseData);

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(normalized)
        );

        return true;

    } catch (error) {

        console.error(
            "Faraid Planner: unable to save case.",
            error
        );

        return false;
    }
}


/**
 * Load the saved case.
 */
export function loadCase() {

    try {

        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return null;
        }

        return normalizeCase(
            JSON.parse(raw)
        );

    } catch (error) {

        console.error(
            "Faraid Planner: unable to load saved case.",
            error
        );

        return null;
    }
}


/**
 * Delete the saved case.
 */
export function deleteSavedCase() {

    try {

        localStorage.removeItem(STORAGE_KEY);

        return true;

    } catch (error) {

        console.error(
            "Faraid Planner: unable to delete saved case.",
            error
        );

        return false;
    }
}


/**
 * Convert a case into downloadable JSON text.
 */
export function exportCaseJSON(caseData) {

    return JSON.stringify(
        normalizeCase(caseData),
        null,
        2
    );
}


/**
 * Import a JSON case.
 */
export function importCaseJSON(json) {

    const parsed =
        typeof json === "string"
            ? JSON.parse(json)
            : json;

    return normalizeCase(parsed);
}
