import assert from "node:assert/strict";

import {
    calculateFaraid
} from "../js/faraid.js";


/*
 * --------------------------------------------------
 * TEST 1
 * Husband + children
 * --------------------------------------------------
 */

{

    const result =
        calculateFaraid({

            husband: true,

            sons: 1,

            daughters: 1

        });


    const husband =
        result.eligible.find(
            heir =>
                heir.heir === "Husband"
        );


    assert.equal(
        husband.share,
        "1/4"
    );

}


/*
 * --------------------------------------------------
 * TEST 2
 * Wife + no children
 * --------------------------------------------------
 */

{

    const result =
        calculateFaraid({

            wives: 1

        });


    const wives =
        result.eligible.find(
            heir =>
                heir.heir ===
                "Wives collectively"
        );


    assert.equal(
        wives.share,
        "1/4 collectively"
    );

}


/*
 * --------------------------------------------------
 * TEST 3
 * Wife + children
 * --------------------------------------------------
 */

{

    const result =
        calculateFaraid({

            wives: 1,

            sons: 2

        });


    const wives =
        result.eligible.find(
            heir =>
                heir.heir ===
                "Wives collectively"
        );


    assert.equal(
        wives.share,
        "1/8 collectively"
    );

}


/*
 * --------------------------------------------------
 * TEST 4
 * Mother + descendants
 * --------------------------------------------------
 */

{

    const result =
        calculateFaraid({

            mother: true,

            sons: 1

        });


    const mother =
        result.eligible.find(
            heir =>
                heir.heir === "Mother"
        );


    assert.equal(
        mother.share,
        "1/6"
    );

}


/*
 * --------------------------------------------------
 * TEST 5
 * One daughter, no son
 * --------------------------------------------------
 */

{

    const result =
        calculateFaraid({

            daughters: 1

        });


    const daughter =
        result.eligible.find(
            heir =>
                heir.heir ===
                "Daughter"
        );


    assert.equal(
        daughter.share,
        "1/2"
    );

}


/*
 * --------------------------------------------------
 * TEST 6
 * Multiple daughters, no sons
 * --------------------------------------------------
 */

{

    const result =
        calculateFaraid({

            daughters: 2

        });


    const daughters =
        result.eligible.find(
            heir =>
                heir.heir ===
                "Daughters collectively"
        );


    assert.equal(
        daughters.share,
        "2/3 collectively"
    );

}


/*
 * --------------------------------------------------
 * TEST 7
 * Father + descendants
 * --------------------------------------------------
 */

{

    const result =
        calculateFaraid({

            father: true,

            sons: 1

        });


    const father =
        result.eligible.find(
            heir =>
                heir.heir === "Father"
        );


    assert.equal(
        father.share,
        "1/6"
    );

}


/*
 * --------------------------------------------------
 * TEST 8
 * Father excludes paternal grandfather
 * --------------------------------------------------
 */

{

    const result =
        calculateFaraid({

            father: true,

            paternalGrandfather: true

        });


    const excluded =
        result.excluded.find(
            heir =>
                heir.heir ===
                "Paternal grandfather"
        );


    assert.ok(
        excluded
    );

}


/*
 * --------------------------------------------------
 * TEST 9
 * Complex grandfather case gets flagged
 * --------------------------------------------------
 */

{

    const result =
        calculateFaraid({

            paternalGrandfather: true,

            fullBrothers: 1

        });


    assert.ok(
        result.reviewFlags.some(
            flag =>
                flag.code ===
                "GRANDFATHER_CASE"
        )
    );

}


/*
 * --------------------------------------------------
 * TEST 10
 * Maternal sibling case gets flagged
 * --------------------------------------------------
 */

{

    const result =
        calculateFaraid({

            maternalSiblings: 1

        });


    assert.ok(
        result.reviewFlags.some(
            flag =>
                flag.code ===
                "MATERNAL_SIBLING_CASE"
        )
    );

}


console.log(
    "All Faraid engine tests passed."
);
