const crypto = require('crypto');

const knexfile = require('../knexfile');
const environment = process.env.NODE_ENV || 'development';
const knex = require('knex')(knexfile[environment]);

const TEST_PASSWORD = 'Testpass1!';

const ROLE = { MEMBER: 1, CREATOR: 2, ADMIN: 3, OWNER: 4 };
const INVITE_STATUS = { PENDING: 1, ACCEPTED: 2, REJECTED_BY_GROUP: 3, REJECTED_BY_USER: 4 };
const RSVP_STATUS = { PENDING: 1, ACCEPTED: 2, REJECTED: 3, MAYBE: 4 };
const REPETITION = { NONE: 1, ANNUALLY: 2, MONTHLY: 3, WEEKLY: 4 };

const encryptPassword = (password) =>
    crypto.createHash('sha256').update(password).digest('hex');

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[randomInt(0, arr.length - 1)];
const shuffle = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = randomInt(0, i);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const USERS = [
    { firstName: 'Maya', lastName: 'Chen', username: 'maya.chen' },
    { firstName: 'Owen', lastName: 'Baxter', username: 'owen.baxter' },
    { firstName: 'Priya', lastName: 'Nair', username: 'priya.nair' },
    { firstName: 'Diego', lastName: 'Ramos', username: 'diego.ramos' },
    { firstName: 'Sasha', lastName: 'Kowalski', username: 'sasha.kowalski' },
];

const GROUP_TEMPLATES = [
    { name: 'Weekend Hikers', description: 'Casual weekend hikes around the area, all skill levels welcome.' },
    { name: 'Board Game Night', description: 'Monthly board game meetups, bring a game or just show up.' },
    { name: 'Book Club', description: 'Reading one book a month and meeting up to discuss it over coffee.' },
    { name: 'Pickup Basketball', description: 'Casual pickup games, usually a couple times a week.' },
    { name: 'Home Cooking Club', description: 'Trying new recipes together and sharing the results.' },
    { name: 'Trivia Team', description: 'Weekly trivia night regulars looking to fill out the roster.' },
    { name: 'Film Discussion Group', description: 'Watching and discussing a film together each month.' },
    { name: 'Running Club', description: 'Group runs of varying distance and pace, everyone welcome.' },
];

const EVENT_LOCATIONS = [
    'Central Park Pavilion',
    'Downtown Community Center',
    "Murphy's Pub",
    'Riverside Trailhead',
    'Maple Street Library',
    'Oakwood Rec Center',
    "Jenna's Place",
];

const EVENT_NOUNS = ['Meetup', 'Session', 'Gathering', 'Hangout', 'Get-Together'];

const randomBirthdate = () => {
    const year = randomInt(1975, 2003);
    const month = String(randomInt(1, 12)).padStart(2, '0');
    const day = String(randomInt(1, 28)).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const randomPhone = () =>
    `${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`;

const daysFromNow = (offsetDays, hour = 18) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    date.setHours(hour, 0, 0, 0);
    return date;
};

const dateInMonth = (monthOffset, dayOfMonth, hour = 12) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + monthOffset);
    date.setDate(dayOfMonth);
    date.setHours(hour, 0, 0, 0);
    return date;
};

async function seedUsers() {
    const zipRows = await knex('zip_code').select('zip_code').orderByRaw('RANDOM()').limit(20);
    if (zipRows.length === 0) {
        throw new Error('zip_code table is empty — make sure the zip_code seed has been run.');
    }

    const hashedPassword = encryptPassword(TEST_PASSWORD);

    const usersToInsert = USERS.map((u, i) => ({
        first_name: u.firstName,
        last_name: u.lastName,
        email: `${u.username}@example.com`,
        username: u.username,
        password: hashedPassword,
        phone: randomPhone(),
        birthdate: randomBirthdate(),
        expo_push_token: null,
        zip_code: randomItem(zipRows).zip_code,
    }));

    const inserted = await knex('user').insert(usersToInsert).returning(['id', 'username']);
    console.log(`Seeded ${inserted.length} users (password for all: "${TEST_PASSWORD}")`);
    return inserted;
}

async function seedGroups() {
    const groupsToInsert = GROUP_TEMPLATES.map((g) => ({
        name: g.name,
        description: g.description,
        public: true,
    }));

    const inserted = await knex('group').insert(groupsToInsert).returning(['id', 'name']);
    console.log(`Seeded ${inserted.length} groups`);
    return inserted;
}

async function seedGroupMemberships(users, groups) {
    const membershipRows = [];
    const groupMembership = {};

    groups.forEach((group, i) => {
        const owner = users[i % users.length];
        const otherUsers = shuffle(users.filter((u) => u.id !== owner.id));
        const memberCount = randomInt(2, Math.min(4, otherUsers.length));
        const members = otherUsers.slice(0, memberCount);

        membershipRows.push({
            group_id: group.id,
            user_id: owner.id,
            allow_notifications: true,
            invited_by_group: false,
            invite_status: INVITE_STATUS.ACCEPTED,
            role: ROLE.OWNER,
        });

        const accepted = [];
        members.forEach((member, idx) => {
            const isLast = idx === members.length - 1;
            const status = isLast ? INVITE_STATUS.REJECTED_BY_USER : INVITE_STATUS.ACCEPTED;

            membershipRows.push({
                group_id: group.id,
                user_id: member.id,
                allow_notifications: true,
                invited_by_group: true,
                invite_status: status,
                role: ROLE.MEMBER,
            });

            if (status === INVITE_STATUS.ACCEPTED) {
                accepted.push(member);
            }
        });

        groupMembership[group.id] = { owner, acceptedMembers: [owner, ...accepted] };
    });

    await knex('group_user').insert(membershipRows);
    console.log(`Seeded ${membershipRows.length} group memberships`);
    return groupMembership;
}

async function seedEvents(groups, groupMembership) {
    const eventRows = [];
    const eventMeta = [];

    groups.forEach((group) => {
        const eventsForGroup = randomInt(2, 4);
        for (let i = 0; i < eventsForGroup; i++) {
            const { owner } = groupMembership[group.id];
            const offsetDays = randomInt(-60, 60);
            const hasEndDate = randomInt(1, 10) <= 3;
            const startDate = daysFromNow(offsetDays, randomInt(9, 20));
            const endDate = hasEndDate
                ? daysFromNow(offsetDays + randomInt(1, 3), randomInt(9, 20))
                : null;

            eventRows.push({
                name: `${group.name} ${randomItem(EVENT_NOUNS)}`,
                description: `A ${randomItem(EVENT_NOUNS).toLowerCase()} for the ${group.name} group.`,
                location: randomItem(EVENT_LOCATIONS),
                date: startDate,
                end_date: endDate,
                cost: randomInt(0, 5) === 0 ? 0 : randomInt(5, 40) + 0.0,
                series_id: null,
                repetition: REPETITION.NONE,
                group_id: group.id,
                host_id: owner.id,
                business_invitation_id: null,
            });
        }
    });

    // A couple of small recurring (weekly) series for calendar/recurrence testing
    const recurringGroups = shuffle(groups).slice(0, 2);
    recurringGroups.forEach((group) => {
        const { owner } = groupMembership[group.id];
        const seriesId = Date.now() + randomInt(1000, 9999) + group.id;
        const occurrences = 3;
        for (let i = 0; i < occurrences; i++) {
            const startDate = daysFromNow(i * 7, randomInt(17, 20));
            eventRows.push({
                name: `${group.name} Weekly ${randomItem(EVENT_NOUNS)}`,
                description: `Recurring weekly ${randomItem(EVENT_NOUNS).toLowerCase()} for the ${group.name} group.`,
                location: randomItem(EVENT_LOCATIONS),
                date: startDate,
                end_date: null,
                cost: 0,
                series_id: seriesId,
                repetition: REPETITION.WEEKLY,
                group_id: group.id,
                host_id: owner.id,
                business_invitation_id: null,
            });
        }
    });

    const inserted = await knex('event').insert(eventRows).returning(['id', 'group_id', 'host_id']);
    console.log(`Seeded ${inserted.length} events`);
    return inserted;
}

async function seedEventInvitations(events, groupMembership) {
    const invitationRows = [];

    events.forEach((event) => {
        const { owner, acceptedMembers } = groupMembership[event.group_id];

        invitationRows.push({
            event_id: event.id,
            user_id: owner.id,
            rsvp_status: RSVP_STATUS.ACCEPTED,
            notifications: true,
        });

        const otherInvitees = acceptedMembers.filter((u) => u.id !== owner.id);
        otherInvitees.forEach((invitee, idx) => {
            const isLast = idx === otherInvitees.length - 1;
            const rsvp = isLast
                ? RSVP_STATUS.REJECTED
                : randomItem([RSVP_STATUS.ACCEPTED, RSVP_STATUS.ACCEPTED, RSVP_STATUS.MAYBE]);

            invitationRows.push({
                event_id: event.id,
                user_id: invitee.id,
                rsvp_status: rsvp,
                notifications: true,
            });
        });
    });

    await knex('event_invitation').insert(invitationRows);
    console.log(`Seeded ${invitationRows.length} event invitations`);
}

async function seedAvailabilityTestGroup(users) {
    const [group] = await knex('group')
        .insert({
            name: 'Availability Test Group',
            description: 'Deterministic group for verifying the availability endpoint end-to-end.',
            public: true,
        })
        .returning(['id', 'name']);

    const owner = users[0];
    const memberOne = users[1];
    const memberTwo = users[2];

    await knex('group_user').insert([
        {
            group_id: group.id,
            user_id: owner.id,
            allow_notifications: true,
            invited_by_group: false,
            invite_status: INVITE_STATUS.ACCEPTED,
            role: ROLE.OWNER,
        },
        {
            group_id: group.id,
            user_id: memberOne.id,
            allow_notifications: true,
            invited_by_group: true,
            invite_status: INVITE_STATUS.ACCEPTED,
            role: ROLE.MEMBER,
        },
        {
            group_id: group.id,
            user_id: memberTwo.id,
            allow_notifications: true,
            invited_by_group: true,
            invite_status: INVITE_STATUS.ACCEPTED,
            role: ROLE.MEMBER,
        },
    ]);

    console.log(`Seeded availability test group "${group.name}" (id ${group.id}) with 3 accepted members: ${owner.username}, ${memberOne.username}, ${memberTwo.username}`);
    return { group, owner, memberOne, memberTwo };
}

async function seedAvailabilityConflictEvents({ group, owner, memberOne, memberTwo }) {
    const eventDefs = [
        {
            name: 'Conflict AM',
            description: 'Deterministic timed conflict, day 10 morning.',
            date: dateInMonth(0, 10, 9),
            endDate: dateInMonth(0, 10, 11),
            hostId: owner.id,
            invitees: [
                { userId: owner.id, rsvpStatus: RSVP_STATUS.ACCEPTED },
                { userId: memberOne.id, rsvpStatus: RSVP_STATUS.ACCEPTED },
            ],
        },
        {
            name: 'Conflict PM',
            description: 'Deterministic open-ended conflict, day 10 afternoon, same day as Conflict AM.',
            date: dateInMonth(0, 10, 15),
            endDate: null,
            hostId: memberOne.id,
            invitees: [
                { userId: memberOne.id, rsvpStatus: RSVP_STATUS.ACCEPTED },
                { userId: memberTwo.id, rsvpStatus: RSVP_STATUS.MAYBE },
            ],
        },
        {
            name: 'Conflict Multi-day',
            description: 'Deterministic three-day span, days 20-22, to exercise per-day splitting.',
            date: dateInMonth(0, 20, 9),
            endDate: dateInMonth(0, 22, 17),
            hostId: owner.id,
            invitees: [
                { userId: owner.id, rsvpStatus: RSVP_STATUS.ACCEPTED },
                { userId: memberTwo.id, rsvpStatus: RSVP_STATUS.ACCEPTED },
            ],
        },
        {
            name: 'Declined Only',
            description: 'Deterministic day where only the host is actually busy, to confirm declines are excluded.',
            date: dateInMonth(0, 25, 10),
            endDate: dateInMonth(0, 25, 12),
            hostId: memberTwo.id,
            invitees: [
                { userId: memberTwo.id, rsvpStatus: RSVP_STATUS.ACCEPTED },
                { userId: owner.id, rsvpStatus: RSVP_STATUS.REJECTED },
            ],
        },
        {
            name: 'Next Month Conflict',
            description: 'Deterministic conflict in the following month, to confirm month pagination refetches correctly.',
            date: dateInMonth(1, 5, 9),
            endDate: dateInMonth(1, 5, 10),
            hostId: owner.id,
            invitees: [
                { userId: owner.id, rsvpStatus: RSVP_STATUS.ACCEPTED },
                { userId: memberOne.id, rsvpStatus: RSVP_STATUS.ACCEPTED },
            ],
        },
    ];

    for (const def of eventDefs) {
        const [event] = await knex('event')
            .insert({
                name: def.name,
                description: def.description,
                location: randomItem(EVENT_LOCATIONS),
                date: def.date,
                end_date: def.endDate,
                cost: 0,
                series_id: null,
                repetition: REPETITION.NONE,
                group_id: group.id,
                host_id: def.hostId,
                business_invitation_id: null,
            })
            .returning(['id']);

        await knex('event_invitation').insert(
            def.invitees.map((invitee) => ({
                event_id: event.id,
                user_id: invitee.userId,
                rsvp_status: invitee.rsvpStatus,
                notifications: true,
            }))
        );
    }

    console.log(`Seeded ${eventDefs.length} deterministic availability events for group "${group.name}"`);
    console.log(`  Day 10 this month: expect red (defined end) for ${owner.username} and ${memberOne.username} in the morning, plus a separate orange (open-ended) interval in the afternoon for ${memberOne.username} and ${memberTwo.username}`);
    console.log(`  Days 20-22 this month: expect the multi-day event to show busy for ${owner.username} and ${memberTwo.username} on all three days`);
    console.log(`  Day 25 this month: expect only ${memberTwo.username} busy — ${owner.username} declined and should not count`);
    console.log(`  Day 5 next month: expect a conflict for ${owner.username} and ${memberOne.username}, only visible after paginating forward one month`);
}

async function run() {
    console.log(`Seeding against NODE_ENV="${environment}" — make sure this is pointed at your local dev DB.`);

    const users = await seedUsers();
    const groups = await seedGroups();
    const groupMembership = await seedGroupMemberships(users, groups);
    const events = await seedEvents(groups, groupMembership);
    await seedEventInvitations(events, groupMembership);

    const availabilityTestGroup = await seedAvailabilityTestGroup(users);
    await seedAvailabilityConflictEvents(availabilityTestGroup);

    console.log('Done.');
}

run()
    .catch((err) => {
        console.error('Seed failed:', err);
        process.exitCode = 1;
    })
    .finally(() => knex.destroy());