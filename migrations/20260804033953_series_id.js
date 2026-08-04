exports.up = async function(knex) {
    const { rows } = await knex.raw('SELECT max(series_id) as max FROM event');
    const startAt = (rows[0].max ?? 0) + 1;

    await knex.raw(`CREATE SEQUENCE event_series_id_seq START WITH ${startAt}`);
};

exports.down = function(knex) {
    return knex.raw('DROP SEQUENCE event_series_id_seq');
};
