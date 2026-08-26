/*
 * Faraid Planner - Faraid Engine
 *
 * Version 0.2.0
 *
 * Purpose:
 *   1. Identify eligible heirs.
 *   2. Identify excluded heirs.
 *   3. Identify the applicable inheritance rule.
 *   4. Calculate exact fractional entitlements.
 *   5. Explain how the distributable estate should be allocated.
 *
 * IMPORTANT:
 * This engine intentionally supports a defined common framework.
 * Complex jurisprudential cases are flagged for specialist review.
 *
 * Fractions are fractions of the DISTRIBUTABLE ESTATE after
 * applicable debts, funeral/burial expenses and valid obligations
 * have been settled.
 */


/* =========================================================
   ENGINE VERSION
========================================================= */

export const FARAID_ENGINE_VERSION = "0.2.0";


/* =========================================================
   BASIC HELPERS
========================================================= */

function toBoolean(value) {
    return (
        value === true ||
        value === 1 ||
        value === "1"
    );
}


function toCount(value) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.max(
        0,
        Math.floor(number)
    );
}


/* =========================================================
   FRACTION ENGINE
========================================================= */

/*
 * Fractions are represented as:
 *
 * {
 *     numerator: 1,
 *     denominator: 6
 * }
 *
 * They are always reduced to their simplest form.
 */

function gcd(a, b) {

    a = Math.abs(a);
    b = Math.abs(b);

    while (b !== 0) {

        const remainder = a % b;

        a = b;
        b = remainder;
    }

    return a || 1;
}


function simplifyFraction(
    numerator,
    denominator
) {

    if (denominator === 0) {
        throw new Error(
            "Fraction denominator cannot be zero."
        );
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

    const divisor =
        gcd(
            numerator,
            denominator
        );

    return {
        numerator:
            numerator / divisor,

        denominator:
            denominator / divisor
    };
}


function fraction(
    numerator,
    denominator
) {

    return simplifyFraction(
        numerator,
        denominator
    );
}


function addFractions(a, b) {

    return simplifyFraction(
        a.numerator * b.denominator +
            b.numerator * a.denominator,

        a.denominator *
            b.denominator
    );
}


function subtractFractions(a, b) {

    return simplifyFraction(
        a.numerator * b.denominator -
            b.numerator * a.denominator,

        a.denominator *
            b.denominator
    );
}


function multiplyFractions(a, b) {

    return simplifyFraction(
        a.numerator * b.numerator,

        a.denominator *
            b.denominator
    );
}


function fractionToString(value) {

    if (value.numerator === 0) {
        return "0";
    }

    if (
        value.denominator === 1
    ) {
        return String(
            value.numerator
        );
    }

    return `${value.numerator}/${value.denominator}`;
}


function fractionToDecimal(value) {

    return (
        value.numerator /
        value.denominator
    ).toFixed(6);
}


const WHOLE =
    fraction(1, 1);


/* =========================================================
   FAMILY NORMALISATION
========================================================= */

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
            toCount(
                input.fullBrothers
            ),

        fullSisters:
            toCount(
                input.fullSisters
            ),

        maternalSiblings:
            toCount(
                input.maternalSiblings
            ),

        sonGrandchildren:
            toBoolean(
                input.sonGrandchildren
            )
    };
}


/* =========================================================
   ENTITLEMENT BUILDERS
========================================================= */

function fixedShare({
    heir,
    count = 1,
    share,
    reason,
    source,
    fractionValue
}) {

    return {

        heir,

        count,

        category: "fixed",

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

        category: "residuary",

        share: "residue",

        fraction: null,

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
        (
            fullBrothers +
            fullSisters +
            maternalSiblings
        ) >= 2;


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


    /*
     * Every fixed entitlement is added here.
     */

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

                heir: "Husband",

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
                    `${fractionToString(share)} collectively`,

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
            (
                hasDescendants ||
                multipleSiblings
            )

                ? fraction(1, 6)

                : fraction(1, 3);


        addFixedEntitlement(

            fixedShare({

                heir: "Mother",

                share:
                    fractionToString(
                        share
                    ),

                fractionValue:
                    share,

                reason:
                    (
                        hasDescendants ||
                        multipleSiblings
                    )

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
       GRANDFATHER
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
       GRANDMOTHER
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
       CHILDREN — SONS
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
       CHILDREN — DAUGHTERS WITHOUT SONS
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
       CHILDREN — DAUGHTERS WITH SONS
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

    if (maternalSiblings > 0) {

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

    if (sonGrandchildren) {

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
       CALCULATE RESIDUE
    ===================================================== */

    let residue =
        subtractFractions(
            WHOLE,
            totalFixedShares
        );


    /*
     * If fixed shares exceed the estate,
     * this case requires specialist handling.
     */

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
       RESIDUARY DISTRIBUTION
    ===================================================== */

    const hasSonResiduary =
        sons > 0;


    const hasDaughterWithSon =
        sons > 0 &&
        daughters > 0;


    let residuaryCalculation =
        null;


    const finalEntitlements = [];


    /*
     * Add fixed entitlements first.
     */

    eligible
        .filter(
            item =>
                item.category === "fixed"
        )
        .forEach(item => {

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
                    `Allocate ${fractionToString(item.fraction)} of the distributable estate to ${item.heir.toLowerCase()}.`

            });

        });


    /* =====================================================
       CHILDREN RESIDUE
    ===================================================== */

    if (
        hasSonResiduary
    ) {

        const units =
            (
                sons * 2
            ) +
            (
                daughters * 1
            );


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

                fraction(2, 1)

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


        /*
         * Individual sons.
         */

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
                    `Allocate ${fractionToString(sonShare)} of the distributable estate to Son ${index}.`
            });
        }


        /*
         * Individual daughters.
         */

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
                    `Allocate ${fractionToString(daughterShare)} of the distributable estate to Daughter ${index}.`
            });
        }
    }


    /* =====================================================
       FATHER RESIDUE WHEN NO DESCENDANTS
    ===================================================== */

    if (
        father &&
        !hasDescendants
    ) {

        const fatherAlreadyListed =
            finalEntitlements.some(
                item =>
                    item.heir === "Father"
            );


        if (!fatherAlreadyListed) {

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
                    `Allocate the remaining ${fractionToString(residue)} of the distributable estate to the father.`
            });
        }
    }


    /* =====================================================
       DAUGHTERS ONLY — RESIDUE AFTER FIXED SHARES
    ===================================================== */

    /*
     * If daughters receive a fixed share and there is
     * additional residue, this simplified engine flags
     * the matter rather than silently applying a disputed
     * doctrine.
     */

    if (
        daughters > 0 &&
        sons === 0 &&
        residue.numerator > 0
    ) {

        reviewFlags.push({

            code:
                "DAUGHTERS_REMAINDER",

            severity:
                "review",

            message:
                "Daughters have a fixed share and additional estate residue remains. The final treatment of the remainder requires the applicable jurisprudential framework."
        });
    }


    /* =====================================================
       FINAL STATUS
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
                flag.severity === "high"
        )
    ) {

        status =
            "input-correction-required";
    }


    /* =====================================================
       SHARE CALCULATION OBJECT
    ===================================================== */

    const fixedShareEntries =
        eligible.filter(
            item =>
                item.category === "fixed"
        );


    const fixedShareBreakdown =
        fixedShareEntries.map(
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

        totalFixedShares,

        remainder:
            residue,

        residuary:
            residuaryCalculation,

        finalEntitlements,

        totalDistributed:
            finalEntitlements.reduce(

                (total, item) =>

                    addFractions(
                        total,
                        item.fraction
                    ),

                fraction(0, 1)
            )
    };


    /* =====================================================
       RETURN RESULT
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

        notes: [

            "This engine provides a structured framework for supported common cases.",

            "Fractions represent portions of the distributable estate after applicable obligations have been settled.",

            "The engine intentionally flags complex jurisprudential cases instead of silently producing a potentially incorrect result.",

            "Final inheritance determination should be reviewed by a qualified Islamic scholar and, where necessary, the relevant legal authority."

        ]

    };
}
