import cron from 'node-cron';
import { activateStartingInvitations, completeEndingInvitations } from './repository';
import { createInvitations } from './controller';

export function startInvitationStatusCron() {
    cron.schedule('0 0 * * *', async () => {
        await activateStartingInvitations();
        await completeEndingInvitations();
    });

    cron.schedule('0 6 * * *', async () => {
        await createInvitations();
    });
}
