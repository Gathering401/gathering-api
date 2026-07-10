import cron from 'node-cron';
import { activateStartingInvitations, completeEndingInvitations } from './repository';

export function startInvitationStatusCron() {
    cron.schedule('0 0 * * *', async () => {
        await activateStartingInvitations();
        await completeEndingInvitations();
    });
}
