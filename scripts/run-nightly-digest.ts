import {sendNightlyDigest} from "../src/notifications";

sendNightlyDigest()
    .then(() => {
        console.log('sendNightlyDigest finished');
        process.exit(0);
    })
    .catch((err) => {
        console.error('sendNightlyDigest failed', err);
        process.exit(1);
    });