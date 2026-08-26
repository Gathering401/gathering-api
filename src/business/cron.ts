import cron from 'node-cron';
import {activateStartingInvitations, completeEndingInvitations} from './repository';
import {createInvitations} from './controller';
import {settleCompletedEvents} from '../billing/controller';
import {sendNightlyDigest} from "../notifications";

export function startInvitationStatusCron() {
    // cron.schedule('0 0 * * *', async () => {
    //     await activateStartingInvitations();
    //     await completeEndingInvitations();
    //     await settleCompletedEvents();
    // });
    //
    // cron.schedule('0 6 * * *', async () => {
    //     await createInvitations();
    // });
    //
    // cron.schedule('0 19 * * *', async () => {
    //     await sendNightlyDigest();
    // }, {timezone: 'America/Chicago'});
}
