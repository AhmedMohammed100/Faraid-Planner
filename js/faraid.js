/*
 * Faraid Engine
 *
 * This module intentionally contains no DOM manipulation.
 *
 * Its responsibility is to receive structured family facts and return
 * a structured Faraid framework.
 *
 * It does NOT attempt to silently resolve every jurisprudential case.
 * Unsupported or complex cases are returned as review flags.
 */


export const FARAID_ENGINE_VERSION = "0.1.0";


/**
 * Convert common UI values into boolean.
 */
function toBoolean(value) {
    return value === true ||
        value === 1 ||
        value === "1";
}


/**
 * Safely convert a number.
 */
function toCount(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.max(0, Math.floor(number));
}


/**
 * Normalise the family input.
 */
export function normalizeFamily(input = {}) {

    return {
        husband: toBoolean(input.husband),

        wives: toCount(input.wives),

        sons: toCount(input.sons),

        daughters: toCount(input.daughters),

        father: toBoolean(input.father),

        mother: toBoolean(input.mother),

        paternalGrandfather:
            toBoolean(input.paternalGrandfather),

        maternalGrandmother:
            toBoolean(input.maternalGrandmother),

        fullBrothers:
            toCount(input.fullBrothers),

        fullSisters:
            toCount(input.fullSisters),

        maternalSiblings:
            toCount(input.maternalSiblings),

        sonGrandchildren:
            toBoolean(input.sonGrandchildren)
    };
}


/**
 * Add a fixed-share entitlement.
 */
function fixedShare({
    heir,
    count = 1,
    share,
    reason
}) {

    return {
        heir,
        count,
        category: "fixed",
        share,
        reason
    };
}


/**
 * Add a residuary entitlement.
 */
function residuaryShare({
    heir,
    count = 1,
    reason
}) {

    return {
        heir,
        count,
        category: "residuary",
        share: "residue",
        reason
    };
}


/**
 * Main Faraid framework function.
 *
 * IMPORTANT:
 * This is intentionally a "supported common framework"
 * rather than a claim that every Faraid scenario has been
 * implemented.
 */
export function calculateFaraid(input = {}) {

    const family = normalizeFamily(input);

    const {
        husband,
        wives,
        sons,
        daughters,
        father,
        mother,
        paternalGrandfather,
        maternalGrandmother,
        fullBrothers,
        fullSisters,
        maternalSiblings,
        sonGrandchildren
    } = family;


    const hasDescendants =
        sons > 0 ||
        daughters > 0;


    const multipleSiblings =
        fullBrothers +
        fullSisters +
        maternalSiblings >= 2;


    const eligible = [];

    const excluded = [];

    const reviewFlags = [];


    /* --------------------------------------------------
       VALIDATION
    -------------------------------------------------- */

    if (husband && wives > 0) {

        reviewFlags.push({
            code: "INVALID_SPOUSE_COMBINATION",

            severity: "high",

            message:
                "A deceased person cannot simultaneously have a surviving husband and surviving wives in the same case."
        });

    }


    if (wives > 4) {

        reviewFlags.push({
            code: "WIVES_COUNT_REVIEW",

            severity: "high",

            message:
                "More than four surviving wives were entered. Verify the factual circumstances before relying on the result."
        });

    }


    /* --------------------------------------------------
       HUSBAND
    -------------------------------------------------- */

    if (husband) {

        eligible.push(
            fixedShare({
                heir: "Husband",
                share: hasDescendants
                    ? "1/4"
                    : "1/2",

                reason: hasDescendants
                    ? "Common fixed-share rule where descendants survive."
                    : "Common fixed-share rule where no descendants survive."
            })
        );

    }


    /* --------------------------------------------------
       WIVES
    -------------------------------------------------- */

    if (wives > 0) {

        eligible.push(
            fixedShare({
                heir: "Wives collectively",
                count: wives,

                share: hasDescendants
                    ? "1/8 collectively"
                    : "1/4 collectively",

                reason: hasDescendants
                    ? "Common fixed-share rule where descendants survive."
                    : "Common fixed-share rule where no descendants survive."
            })
        );

    }


    /* --------------------------------------------------
       MOTHER
    -------------------------------------------------- */

    if (mother) {

        if (hasDescendants || multipleSiblings) {

            eligible.push(
                fixedShare({
                    heir: "Mother",

                    share: "1/6",

                    reason:
                        "Common fixed-share rule where descendants or multiple siblings survive."
                })
            );

        } else {

            eligible.push(
                fixedShare({
                    heir: "Mother",

                    share: "1/3",

                    reason:
                        "Common fixed-share rule in the absence of descendants and multiple siblings."
                })
            );

        }

    }


    /* --------------------------------------------------
       FATHER
    -------------------------------------------------- */

    if (father) {

        if (hasDescendants) {

            eligible.push(
                fixedShare({
                    heir: "Father",

                    share: "1/6",

                    reason:
                        "Common fixed share where descendants survive."
                })
            );

        } else {

            eligible.push(
                residuaryShare({
                    heir: "Father",

                    reason:
                        "In this supported common framework the father takes the residue where no descendants survive."
                })
            );

        }

    }


    /* --------------------------------------------------
       FATHER / GRANDFATHER
    -------------------------------------------------- */

    if (father && paternalGrandfather) {

        excluded.push({
            heir: "Paternal grandfather",

            reason:
                "The father survives and takes precedence in this common framework."
        });

    }


    if (!father && paternalGrandfather) {

        reviewFlags.push({
            code: "GRANDFATHER_CASE",

            severity: "review",

            message:
                "A paternal grandfather survives without the father. Grandfather cases, particularly where siblings also survive, require detailed jurisprudential review."
        });

    }


    /* --------------------------------------------------
       GRANDMOTHER
    -------------------------------------------------- */

    if (maternalGrandmother && mother) {

        excluded.push({
            heir: "Maternal grandmother",

            reason:
                "The mother survives and excludes the grandmother in this common framework."
        });

    }


    if (maternalGrandmother && !mother) {

        reviewFlags.push({
            code: "GRANDMOTHER_CASE",

            severity: "review",

            message:
                "A maternal grandmother is present without the mother. Confirm her eligibility and share under the applicable jurisprudential framework."
        });

    }


    /* --------------------------------------------------
       CHILDREN
    -------------------------------------------------- */

    if (sons > 0) {

        eligible.push(
            residuaryShare({
                heir: "Sons",

                count: sons,

                reason:
                    "Sons participate in the residuary estate."
            })
        );

    }


    if (daughters > 0 && sons === 0) {

        if (daughters === 1) {

            eligible.push(
                fixedShare({
                    heir: "Daughter",

                    count: 1,

                    share: "1/2",

                    reason:
                        "Common fixed-share rule for one daughter where no son survives."
                })
            );

        } else {

            eligible.push(
                fixedShare({
                    heir: "Daughters collectively",

                    count: daughters,

                    share: "2/3 collectively",

                    reason:
                        "Common fixed-share rule for two or more daughters where no son survives."
                })
            );

        }

    }


    if (daughters > 0 && sons > 0) {

        eligible.push(
            residuaryShare({
                heir: "Daughters with sons",

                count: daughters,

                reason:
                    "Daughters participate in the residue with sons, subject to the established 2:1 ratio."
            })
        );

    }


    /* --------------------------------------------------
       FULL SIBLINGS
    -------------------------------------------------- */

    if (hasDescendants && (fullBrothers > 0 || fullSisters > 0)) {

        excluded.push({
            heir: "Full siblings",

            reason:
                "In the common framework, surviving descendants exclude full siblings from the residue."
        });

    }


    if (father && (fullBrothers > 0 || fullSisters > 0)) {

        excluded.push({
            heir: "Full siblings",

            reason:
                "In the common framework, a surviving father excludes full siblings."
        });

    }


    if (
        !father &&
        !hasDescendants &&
        (fullBrothers > 0 || fullSisters > 0)
    ) {

        reviewFlags.push({
            code: "FULL_SIBLING_CASE",

            severity: "review",

            message:
                "A full-sibling inheritance case is present. Exact treatment depends on the complete family configuration and applicable jurisprudential rules."
        });

    }


    /* --------------------------------------------------
       MATERNAL SIBLINGS
    -------------------------------------------------- */

    if (maternalSiblings > 0) {

        if (
            father ||
            mother ||
            hasDescendants
        ) {

            excluded.push({
                heir: "Maternal siblings",

                reason:
                    "A surviving parent or descendant may exclude maternal siblings in the common framework."
            });

        } else {

            reviewFlags.push({
                code: "MATERNAL_SIBLING_CASE",

                severity: "review",

                message:
                    "Maternal sibling inheritance is present and requires the applicable detailed rule set."
            });

        }

    }


    /* --------------------------------------------------
       SON GRANDCHILDREN
    -------------------------------------------------- */

    if (sonGrandchildren) {

        reviewFlags.push({
            code: "SON_GRANDCHILDREN_CASE",

            severity: "review",

            message:
                "Grandchildren through a son are present. Their eligibility depends on the surviving children and detailed Hajb rules."
        });

    }


    /* --------------------------------------------------
       FINAL REVIEW STATUS
    -------------------------------------------------- */

    let status = "supported-common-framework";


    if (reviewFlags.length > 0) {

        status = "specialist-review-required";

    }


    if (
        reviewFlags.some(
            flag => flag.severity === "high"
        )
    ) {

        status = "input-correction-required";

    }


    return {

        engineVersion:
            FARAID_ENGINE_VERSION,

        status,

        family,

        hasDescendants,

        eligible,

        excluded,

        reviewFlags,

        notes: [
            "This engine provides a structured framework for supported common cases.",
            "It intentionally flags complex jurisprudential cases instead of silently producing a potentially incorrect result.",
            "Final inheritance determination should be reviewed by a qualified Islamic scholar."
        ]

    };
}
