import { createInvitations } from '../src/business/controller';

createInvitations()
    .then(() => {
        console.log('createInvitations finished');
        process.exit(0);
    })
    .catch((err) => {
        console.error('createInvitations failed', err);
        process.exit(1);
    });