const Papa = require('papaparse');
const {readFileSync} = require("fs");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
    await knex('zip_code').del();
    const raw = readFileSync("C:/Users/jnnys/Downloads/simplemaps_uszips_basicv1.95.1/uszips.csv");
    let rows = [];
    Papa.parse(raw.toString(), {
        columns: true,
        complete({data}) {
            rows = data;
        }
    });
    const batches = [];
    for (let i = 0; i < rows.length; i += 1000) {
        batches.push(rows.slice(i, i + 1000));
    }
    for (const batch of batches) {
        await knex('zip_code').insert(
            batch.map((r) => ({
                zip_code: r[0],
                latitude: Number(r[1]),
                longitude: Number(r[2]),
            }))
        );
    }
};
