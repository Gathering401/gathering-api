import cron from 'node-cron';
import { sweepMonthlyInvoices } from './controller';

export function startBillingCron() {
    // cron.schedule('0 3 1 * *', async () => {
    //     await sweepMonthlyInvoices();
    // });
}
