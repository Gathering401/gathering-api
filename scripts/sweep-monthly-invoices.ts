import {sweepMonthlyInvoices} from "../src/billing/controller";

sweepMonthlyInvoices()
    .then(() => {
        console.log('sweepMonthlyInvoices finished');
        process.exit(0);
    })
    .catch((err) => {
        console.error('sweepMonthlyInvoices failed', err);
        process.exit(1);
    });