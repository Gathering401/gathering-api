import {settleCompletedEvents} from "../src/billing/controller";

settleCompletedEvents()
    .then(() => {
        console.log('settleCompletedEvents finished');
        process.exit(0);
    })
    .catch((err) => {
        console.error('settleCompletedEvents failed', err);
        process.exit(1);
    });