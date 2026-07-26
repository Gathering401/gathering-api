import {activateStartingInvitations, completeEndingInvitations} from "../src/business/repository";

activateStartingInvitations()
    .then(() => {
        console.log('activateStartingInvitations finished');
        process.exit(0);
    })
    .catch((err) => {
        console.error('activateStartingInvitations failed', err);
        process.exit(1);
    });

completeEndingInvitations()
    .then(() => {
        console.log('completeEndingInvitations finished');
        process.exit(0);
    })
    .catch((err) => {
        console.error('completeEndingInvitations failed', err);
        process.exit(1);
    });