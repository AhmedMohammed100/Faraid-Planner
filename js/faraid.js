/*
 * Faraid Planner - Faraid Engine
 * Version 0.3.0
 *
 * Purpose:
 *  1. Identify eligible heirs.
 *  2. Identify excluded heirs.
 *  3. Identify the applicable rule.
 *  4. Calculate exact fractional entitlements for supported cases.
 *  5. Explain distribution instructions.
 *
 * IMPORTANT:
 * This is a structured planning engine, not a fatwa or legal determination.
 * Complex jurisprudential cases are deliberately flagged for specialist review.
 *
 * Fractions are portions of the DISTRIBUTABLE ESTATE after applicable
 * debts, funeral/burial expenses and valid obligations have been settled.
 */

export const FARAID_ENGINE_VERSION = "0.3.0";


/* =========================================================
   FRACTION HELPERS
========================================================= */

function gcd(a, b) {
    a = Math.abs(Number(a));
    b = Math.abs(Number(b));

    while (b !== 0) {
        const r = a % b;
        a = b;
        b = r;
    }

    return a || 1;
}

function fraction(numerator, denominator = 1) {
    numerator = Number(numerator);
    denominator = Number(denominator);

    if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
        throw new Error("Invalid fraction.");
    }

    if (denominator === 0) {
        throw new Error("Fraction denominator cannot be zero.");
    }

    if (numerator === 0) {
        return {
            numerator: 0,
            denominator: 1
        };
    }

    if (denominator < 0) {
        numerator *= -1;
        denominator *= -1;
    }

    const d = gcd(numerator, denominator);

    return {
        numerator: numerator / d,
        denominator: denominator / d
    };
}

function addFractions(a, b) {
    return fraction(
        a.numerator * b.denominator +
        b.numerator * a.denominator,
        a.denominator * b.denominator
    );
}

function subtractFractions(a, b) {
    return fraction(
        a.numerator * b.denominator -
        b.numerator * a.denominator,
        a.denominator * b.denominator
    );
}

function multiplyFractions(a, b) {
    return fraction(
        a.numerator * b.numerator,
        a.denominator * b.denominator
    );
}

function fractionToString(value) {
    if (!value) return "—";

    if (value.numerator === 0) {
        return "0";
    }

    if (value.denominator === 1) {
        return String(value.numerator);
    }

    return `${value.numerator}/${value.denominator}`;
}

function fractionToDecimal(value) {
    if (!value || value.denominator === 0) {
        return "0.000000";
    }

    return (
        value.numerator /
        value.denominator
    ).toFixed(6);
}

const WHOLE = fraction(1, 1);


/* =========================================================
   INPUT NORMALISATION
========================================================= */

function toBoolean(value) {
    return (
        value === true ||
        value === 1 ||
        value === "1"
    );
}

function toCount(value) {
    const n = Number(value);

    if (!Number.isFinite(n)) {
        return 0;
    }

    return Math.max(
        0,
        Math.floor(n)
    );
}

export function normalizeFamily(input = {}) {

    return {

        husband:
            toBoolean(input.husband),

        wives:
            toCount(input.wives),

        sons:
            toCount(input.sons),

        daughters:
            toCount(input.daughters),

        father:
            toBoolean(input.father),

        mother:
            toBoolean(input.mother),

        paternalGrandfather:
            toBoolean(
                input.paternalGrandfather
            ),

        maternalGrandmother:
            toBoolean(
                input.maternalGrandmother
            ),

        fullBrothers:
            toCount(input.fullBrothers),

        fullSisters:
            toCount(input.fullSisters),

        maternalSiblings:
            toCount(input.maternalSiblings),

        sonGrandchildren:
            toBoolean(
                input.sonGrandchildren
            )
    };
}


/* =========================================================
   ENTITLEMENT HELPERS
========================================================= */

function fixedShare({
    heir,
    count = 1,
    share,
    fractionValue,
    reason,
    source
}) {

    return {

        heir,

        count,

        category:
            "fixed",

        share,

        fraction:
            fractionValue,

        reason,

        source
    };
}

function residuaryShare({
    heir,
    count = 1,
    reason,
    source
}) {

    return {

        heir,

        count,

        category:
            "residuary",

        share:
            "residue",

        fraction:
            null,

        reason,

        source
    };
}


/* =========================================================
   MAIN ENGINE
========================================================= */

export function calculateFaraid(
    input = {}
) {

    const family =
        normalizeFamily(input);

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


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
        husband &&
        wives > 0
    ) {

        reviewFlags.push({

            code:
                "INVALID_SPOUSE_COMBINATION",

            severity:
                "high",

            message:
                "A surviving husband and surviving wives cannot be entered together for the same deceased person."

        });
    }


    if (wives > 4) {

        reviewFlags.push({

            code:
                "WIVES_COUNT_REVIEW",

            severity:
                "high",

            message:
                "More than four surviving wives were entered. Verify the factual circumstances."

        });
    }


    /* =====================================================
       FIXED SHARE TRACKING
    ===================================================== */

    let totalFixedShares =
        fraction(0, 1);


    function addFixedEntitlement(
        entitlement
    ) {

        totalFixedShares =
            addFractions(
                totalFixedShares,
                entitlement.fraction
            );

        eligible.push(
            entitlement
        );
    }


    /* =====================================================
       HUSBAND
    ===================================================== */

    if (husband) {

        const share =
            hasDescendants
                ? fraction(1, 4)
                : fraction(1, 2);


        addFixedEntitlement(

            fixedShare({

                heir:
                    "Husband",

                share:
                    fractionToString(
                        share
                    ),

                fractionValue:
                    share,

                reason:
                    hasDescendants
                        ? "Qur'anic fixed share where descendants survive."
                        : "Qur'anic fixed share where no descendants survive.",

                source:
                    "Qur'an 4:12"

            })

        );
    }


    /* =====================================================
       WIVES
    ===================================================== */

    if (wives > 0) {

        const share =
            hasDescendants
                ? fraction(1, 8)
                : fraction(1, 4);


        addFixedEntitlement(

            fixedShare({

                heir:
                    "Wives collectively",

                count:
                    wives,

                share:
                    `${fractionToString(
                        share
                    )} collectively`,

                fractionValue:
                    share,

                reason:
                    hasDescendants
                        ? "Qur'anic fixed share where descendants survive."
                        : "Qur'anic fixed share where no descendants survive.",

                source:
                    "Qur'an 4:12"

            })

        );
    }


    /* =====================================================
       MOTHER
    ===================================================== */

    if (mother) {

        const share =
            hasDescendants ||
            multipleSiblings

                ? fraction(1, 6)

                : fraction(1, 3);


        addFixedEntitlement(

            fixedShare({

                heir:
                    "Mother",

                share:
                    fractionToString(
                        share
                    ),

                fractionValue:
                    share,

                reason:

                    hasDescendants ||
                    multipleSiblings

                        ? "Qur'anic fixed share where descendants or qualifying multiple siblings survive."

                        : "Qur'anic fixed share where there are no descendants and no qualifying multiple siblings.",

                source:
                    "Qur'an 4:11"

            })

        );
    }


    /* =====================================================
       FATHER
    ===================================================== */

    /*
     * Where descendants survive, the father has a fixed 1/6.
     *
     * If there are daughters but no sons, the father may also
     * receive the applicable residue in this supported
     * framework.
     *
     * Where no descendants survive, the father is treated as
     * residuary in this supported framework.
     */

    if (father) {

        if (hasDescendants) {

            addFixedEntitlement(

                fixedShare({

                    heir:
                        "Father",

                    share:
                        "1/6",

                    fractionValue:
                        fraction(1, 6),

                    reason:
                        "Qur'anic fixed share where descendants survive.",

                    source:
                        "Qur'an 4:11"

                })

            );

        } else {

            eligible.push(

                residuaryShare({

                    heir:
                        "Father",

                    reason:
                        "Father takes the residue in this supported framework where no descendants survive.",

                    source:
                        "Qur'an 4:11"

                })

            );
        }
    }


    /* =====================================================
       PATERNAL GRANDFATHER
    ===================================================== */

    if (
        father &&
        paternalGrandfather
    ) {

        excluded.push({

            heir:
                "Paternal grandfather",

            reason:
                "The surviving father takes precedence in this supported framework."

        });

    } else if (
        !father &&
        paternalGrandfather
    ) {

        reviewFlags.push({

            code:
                "GRANDFATHER_CASE",

            severity:
                "review",

            message:
                "A paternal grandfather survives without the father. Detailed jurisprudential review is required."

        });
    }


    /* =====================================================
       MATERNAL GRANDMOTHER
    ===================================================== */

    if (
        maternalGrandmother &&
        mother
    ) {

        excluded.push({

            heir:
                "Maternal grandmother",

            reason:
                "The surviving mother excludes the maternal grandmother in this supported framework."

        });

    } else if (
        maternalGrandmother &&
        !mother
    ) {

        reviewFlags.push({

            code:
                "GRANDMOTHER_CASE",

            severity:
                "review",

            message:
                "A maternal grandmother is present without the mother. Confirm her eligibility under the applicable jurisprudential framework."

        });
    }


    /* =====================================================
       SONS
    ===================================================== */

    if (sons > 0) {

        eligible.push(

            residuaryShare({

                heir:
                    "Sons",

                count:
                    sons,

                reason:
                    "Sons participate in the residuary estate after applicable fixed shares.",

                source:
                    "Qur'an 4:11"

            })

        );
    }


    /* =====================================================
       DAUGHTERS WITHOUT SONS
    ===================================================== */

    if (
        daughters > 0 &&
        sons === 0
    ) {

        if (daughters === 1) {

            addFixedEntitlement(

                fixedShare({

                    heir:
                        "Daughter",

                    count:
                        1,

                    share:
                        "1/2",

                    fractionValue:
                        fraction(1, 2),

                    reason:
                        "Qur'anic fixed share for one daughter where no son survives.",

                    source:
                        "Qur'an 4:11"

                })

            );

        } else {

            addFixedEntitlement(

                fixedShare({

                    heir:
                        "Daughters collectively",

                    count:
                        daughters,

                    share:
                        "2/3 collectively",

                    fractionValue:
                        fraction(2, 3),

                    reason:
                        "Qur'anic fixed share for two or more daughters where no son survives.",

                    source:
                        "Qur'an 4:11"

                })

            );
        }
    }


    /* =====================================================
       DAUGHTERS WITH SONS
    ===================================================== */

    if (
        daughters > 0 &&
        sons > 0
    ) {

        eligible.push(

            residuaryShare({

                heir:
                    "Daughters with sons",

                count:
                    daughters,

                reason:
                    "Daughters participate in the residue with sons according to the established 2:1 male-to-female ratio.",

                source:
                    "Qur'an 4:11"

            })

        );
    }


    /* =====================================================
       FULL SIBLINGS
    ===================================================== */

    if (

        hasDescendants &&

        (
            fullBrothers > 0 ||
            fullSisters > 0
        )

    ) {

        excluded.push({

            heir:
                "Full siblings",

            reason:
                "In this supported framework, surviving descendants exclude full siblings."

        });

    } else if (

        father &&

        (
            fullBrothers > 0 ||
            fullSisters > 0
        )

    ) {

        excluded.push({

            heir:
                "Full siblings",

            reason:
                "In this supported framework, a surviving father excludes full siblings."

        });

    } else if (

        !father &&
        !hasDescendants &&

        (
            fullBrothers > 0 ||
            fullSisters > 0
        )

    ) {

        reviewFlags.push({

            code:
                "FULL_SIBLING_CASE",

            severity:
                "review",

            message:
                "A full-sibling inheritance case is present. Exact treatment requires the complete family configuration and applicable jurisprudential rules."

        });
    }


    /* =====================================================
       MATERNAL SIBLINGS
    ===================================================== */

    if (
        maternalSiblings > 0
    ) {

        if (
            father ||
            mother ||
            hasDescendants
        ) {

            excluded.push({

                heir:
                    "Maternal siblings",

                reason:
                    "A surviving parent or descendant excludes maternal siblings in this supported framework."

            });

        } else {

            reviewFlags.push({

                code:
                    "MATERNAL_SIBLING_CASE",

                severity:
                    "review",

                message:
                    "Maternal sibling inheritance is present and requires detailed jurisprudential review."

            });
        }
    }


    /* =====================================================
       SON GRANDCHILDREN
    ===================================================== */

    if (
        sonGrandchildren
    ) {

        reviewFlags.push({

            code:
                "SON_GRANDCHILDREN_CASE",

            severity:
                "review",

            message:
                "Grandchildren through a son are present. Their eligibility depends on the surviving children and detailed Hajb rules."

        });
    }


    /* =====================================================
       FIXED-SHARE TOTAL AND RESIDUE
    ===================================================== */

    let residue =
        subtractFractions(

            WHOLE,

            totalFixedShares

        );


    if (
        residue.numerator < 0
    ) {

        reviewFlags.push({

            code:
                "FIXED_SHARES_EXCEED_WHOLE",

            severity:
                "high",

            message:
                "The fixed shares exceed the whole estate under the current framework. This requires specialist review."

        });

        residue =
            fraction(0, 1);
    }


    /* =====================================================
       RESIDUARY CALCULATION
    ===================================================== */

    const hasSonResiduary =
        sons > 0;


    let residuaryCalculation =
        null;


    const finalEntitlements =
        [];


    /* =====================================================
       FIXED ENTITLEMENTS
    ===================================================== */

    eligible

        .filter(
            item =>
                item.category === "fixed"
        )

        .forEach(
            item => {

                finalEntitlements.push({

                    heir:
                        item.heir,

                    count:
                        item.count,

                    category:
                        "fixed",

                    fraction:
                        item.fraction,

                    share:
                        fractionToString(
                            item.fraction
                        ),

                    decimal:
                        fractionToDecimal(
                            item.fraction
                        ),

                    instruction:
                        `Allocate ${fractionToString(
                            item.fraction
                        )} of the distributable estate to ${item.heir.toLowerCase()}.`

                });

            }
        );


    /* =====================================================
       CHILDREN RESIDUE
    ===================================================== */

    if (
        hasSonResiduary
    ) {

        const units =
            sons * 2 +
            daughters;


        const valuePerUnit =
            multiplyFractions(

                residue,

                fraction(
                    1,
                    units
                )

            );


        const sonShare =
            multiplyFractions(

                valuePerUnit,

                fraction(
                    2,
                    1
                )

            );


        const daughterShare =
            valuePerUnit;


        const sonsCollective =
            multiplyFractions(

                sonShare,

                fraction(
                    sons,
                    1
                )

            );


        const daughtersCollective =
            multiplyFractions(

                daughterShare,

                fraction(
                    daughters,
                    1
                )

            );


        residuaryCalculation = {

            type:
                "children-2-to-1",

            residue,

            units,

            sons,

            daughters,

            valuePerUnit,

            individualSonShare:
                sonShare,

            individualDaughterShare:
                daughterShare,

            sonsCollective,

            daughtersCollective

        };


        /* ---------------------------------------------
           INDIVIDUAL SONS
        --------------------------------------------- */

        for (
            let index = 1;
            index <= sons;
            index++
        ) {

            finalEntitlements.push({

                heir:
                    `Son ${index}`,

                count:
                    1,

                category:
                    "residuary",

                fraction:
                    sonShare,

                share:
                    fractionToString(
                        sonShare
                    ),

                decimal:
                    fractionToDecimal(
                        sonShare
                    ),

                instruction:
                    `Allocate ${fractionToString(
                        sonShare
                    )} of the distributable estate to Son ${index}.`

            });
        }


        /* ---------------------------------------------
           INDIVIDUAL DAUGHTERS
        --------------------------------------------- */

        for (
            let index = 1;
            index <= daughters;
            index++
        ) {

            finalEntitlements.push({

                heir:
                    `Daughter ${index}`,

                count:
                    1,

                category:
                    "residuary",

                fraction:
                    daughterShare,

                share:
                    fractionToString(
                        daughterShare
                    ),

                decimal:
                    fractionToDecimal(
                        daughterShare
                    ),

                instruction:
                    `Allocate ${fractionToString(
                        daughterShare
                    )} of the distributable estate to Daughter ${index}.`

            });
        }
    }


    /* =====================================================
       FATHER WITH DAUGHTERS BUT NO SONS
    ===================================================== */

    if (

        father &&

        daughters > 0 &&

        sons === 0

    ) {

        const fatherFixed =
            fraction(1, 6);


        /*
         * The father is already present in
         * finalEntitlements as a fixed share.
         *
         * The remaining residue is then added
         * to the father's entitlement.
         */

        const fatherFixedIndex =
            finalEntitlements.findIndex(

                item =>
                    item.heir === "Father"

            );


        const fatherResiduary =
            residue;


        if (
            fatherResiduary.numerator > 0
        ) {

            if (
                fatherFixedIndex >= 0
            ) {

                const existing =
                    finalEntitlements[
                        fatherFixedIndex
                    ];


                existing.additionalFraction =
                    fatherResiduary;


                existing.additionalShare =
                    fractionToString(
                        fatherResiduary
                    );


                existing.totalFraction =
                    addFractions(

                        fatherFixed,

                        fatherResiduary

                    );


                existing.share =
                    fractionToString(

                        existing.totalFraction

                    );


                existing.instruction =
                    `Allocate the father's fixed 1/6 share plus the remaining ${fractionToString(
                        fatherResiduary
                    )} of the distributable estate. Total father entitlement: ${fractionToString(
                        existing.totalFraction
                    )}.`;

            }
        }
    }


    /* =====================================================
       FATHER RESIDUE WITHOUT DESCENDANTS
    ===================================================== */

    if (
        father &&
        !hasDescendants
    ) {

        const fatherAlreadyListed =
            finalEntitlements.some(

                item =>
                    item.heir ===
                    "Father"

            );


        if (
            !fatherAlreadyListed
        ) {

            finalEntitlements.push({

                heir:
                    "Father",

                count:
                    1,

                category:
                    "residuary",

                fraction:
                    residue,

                share:
                    fractionToString(
                        residue
                    ),

                decimal:
                    fractionToDecimal(
                        residue
                    ),

                instruction:
                    `Allocate the remaining ${fractionToString(
                        residue
                    )} of the distributable estate to the father.`

            });
        }
    }


    /* =====================================================
       DAUGHTERS-ONLY REMAINDER
    ===================================================== */

    if (

        daughters > 0 &&

        sons === 0 &&

        residue.numerator > 0 &&

        !father

    ) {

        reviewFlags.push({

            code:
                "DAUGHTERS_REMAINDER",

            severity:
                "review",

            message:
                "Daughters have a fixed share and additional estate residue remains. The treatment of the remainder requires the applicable jurisprudential framework."

        });
    }


    /* =====================================================
       FINAL ENTITLEMENT TOTAL
    ===================================================== */

    const totalDistributed =
        finalEntitlements.reduce(

            (
                total,
                item
            ) => {

                const base =
                    item.totalFraction ||
                    item.fraction ||
                    fraction(0, 1);


                return addFractions(

                    total,

                    base

                );

            },

            fraction(0, 1)

        );


    /*
     * If a father has both fixed and additional
     * residuary portions, replace his fixed amount
     * with the combined amount when calculating
     * the total.
     */

    const fatherCombined =
        finalEntitlements.find(

            item =>
                item.heir === "Father" &&
                item.totalFraction

        );


    let correctedTotal =
        totalDistributed;


    if (
        fatherCombined
    ) {

        correctedTotal =
            subtractFractions(

                totalDistributed,

                fatherCombined.fraction

            );


        correctedTotal =
            addFractions(

                correctedTotal,

                fatherCombined.totalFraction

            );
    }


    /* =====================================================
       STATUS
    ===================================================== */

    let status =
        "supported-common-framework";


    if (
        reviewFlags.length > 0
    ) {

        status =
            "specialist-review-required";
    }


    if (
        reviewFlags.some(

            flag =>
                flag.severity ===
                "high"

        )
    ) {

        status =
            "input-correction-required";
    }


    /* =====================================================
       SHARE CALCULATION
    ===================================================== */

    const fixedShareBreakdown =

        eligible

            .filter(

                item =>
                    item.category ===
                    "fixed"

            )

            .map(

                item => ({

                    heir:
                        item.heir,

                    count:
                        item.count,

                    share:
                        fractionToString(
                            item.fraction
                        ),

                    fraction:
                        item.fraction

                })

            );


    const shareCalculation = {

        whole:
            WHOLE,

        fixedShares:
            fixedShareBreakdown,

        totalFixedShares:
            totalFixedShares,

        remainder:
            residue,

        residuary:
            residuaryCalculation,

        finalEntitlements:
            finalEntitlements,

        totalDistributed:
            correctedTotal

    };


    /* =====================================================
       FINAL RESULT
    ===================================================== */

    return {

        engineVersion:
            FARAID_ENGINE_VERSION,

        status,

        family,

        hasDescendants,

        eligible,

        excluded,

        reviewFlags,

        shareCalculation,

        finalEntitlements,

        notes: [

            "This engine provides a structured framework for supported common cases.",

            "Fractions represent portions of the distributable estate after applicable obligations have been settled.",

            "Complex jurisprudential cases are intentionally flagged instead of being silently resolved.",

            "Final inheritance determination should be reviewed by a qualified Islamic scholar and, where necessary, the relevant legal authority."

        ]

    };
}
