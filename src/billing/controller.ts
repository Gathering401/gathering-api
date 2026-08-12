import {Request, Response} from "express";
import Stripe from "stripe";
import {
    selectUnbilledCompletedEvents,
    insertChargeLedgerEntries,
    selectUnsweptLedgerRows,
    selectOpenInvoiceBusinessIds,
    insertBusinessInvoice,
    updateLedgerRowsInvoiceId,
    selectBusinessInvoiceByStripeId,
    updateBusinessInvoiceStatus,
    updateBusinessPaymentStatus,
} from "./repository";
import {ChargeLedgerEntry, RSVP_FEE_PERCENTAGE, UnsweptLedgerRow} from "./types";
import {createCampaignInvoiceItem, createAndFinalizeInvoice, verifyWebhookEvent} from "./stripe";
import {BusinessInvoiceStatus} from "../common/enums/businessInvoiceStatus";
import {BusinessPaymentStatus} from "../common/enums/businessPaymentStatus";
import {getBusinessByStripeCustomerId} from "../business/repository";

export const settleCompletedEvents = async (): Promise<void> => {
    const unbilledEvents = await selectUnbilledCompletedEvents();
    if (!unbilledEvents.length) return;

    const entries: ChargeLedgerEntry[] = unbilledEvents.map(event => {
        const rsvpCount = Number(event.rsvp_count);
        const averageCost = Number(event.average_cost);
        const unitPrice = averageCost * RSVP_FEE_PERCENTAGE;

        return {
            businessId: event.business_id,
            businessInvitationId: event.business_invitation_id,
            eventId: event.event_id,
            rsvpCount,
            unitPrice,
            amount: rsvpCount * unitPrice,
            invoiceId: null,
        }
    });

    await insertChargeLedgerEntries(entries);
}

const groupBy = <T, K extends string | number>(items: T[], keyFn: (item: T) => K): Map<K, T[]> => {
    const groups = new Map<K, T[]>();

    for (const item of items) {
        const key = keyFn(item);
        const group = groups.get(key);

        if (group) {
            group.push(item);
        } else {
            groups.set(key, [item]);
        }
    }

    return groups;
}

export const sweepMonthlyInvoices = async (): Promise<void> => {
    const unsweptRows = await selectUnsweptLedgerRows();
    if (!unsweptRows.length) return;

    const openInvoiceBusinessIds = await selectOpenInvoiceBusinessIds();
    const rowsByBusiness = groupBy(unsweptRows, row => row.business_id);

    for (const [businessId, businessRows] of rowsByBusiness) {
        if (openInvoiceBusinessIds.includes(businessId)) continue;
        if (!businessRows[0]) continue;

        const customerId = businessRows[0].stripe_customer_id;
        if (!customerId) continue;

        const rowsByCampaign = groupBy(businessRows, row => row.business_invitation_id);
        let totalAmount = 0;

        for (const campaignRows of rowsByCampaign.values()) {
            if(!campaignRows[0]) continue;
            const campaignAmount = campaignRows.reduce((sum: number, row: UnsweptLedgerRow) => sum + Number(row.amount), 0);
            const eventCount = campaignRows.length;
            const rsvpTotal = campaignRows.reduce((sum: number, row: UnsweptLedgerRow) => sum + Number(row.rsvp_count), 0);
            totalAmount += campaignAmount;

            await createCampaignInvoiceItem(
                customerId,
                Math.round(campaignAmount * 100),
                `${campaignRows[0].business_invitation_name} — ${eventCount} event(s), ${rsvpTotal} accepted RSVP(s)`
            );
        }

        const stripeInvoice = await createAndFinalizeInvoice(customerId);

        const [insertedInvoice] = await insertBusinessInvoice({
            businessId,
            stripeInvoiceId: stripeInvoice.id as string,
            hostedInvoiceUrl: stripeInvoice.hosted_invoice_url ?? null,
            amount: totalAmount,
            status: BusinessInvoiceStatus.open,
        });

        const ledgerIds = businessRows.map(row => row.ledger_id);
        await updateLedgerRowsInvoiceId(ledgerIds, insertedInvoice!.id as number);
    }
}

export const handleStripeWebhook = async (req: Request, res: Response) => {
    try {
        const signature = req.headers['stripe-signature'] as string;
        const event = verifyWebhookEvent(req.body, signature);

        if (event.type === 'invoice.paid') {
            const invoice = event.data.object as Stripe.Invoice;
            const localInvoice = await selectBusinessInvoiceByStripeId(invoice.id as string);

            if (localInvoice) {
                await updateBusinessInvoiceStatus(localInvoice.id as number, BusinessInvoiceStatus.paid);
                await updateBusinessPaymentStatus(localInvoice.businessId, BusinessPaymentStatus.goodStanding);
            }
        }

        if (event.type === 'invoice.payment_failed') {
            const invoice = event.data.object as Stripe.Invoice;
            const localInvoice = await selectBusinessInvoiceByStripeId(invoice.id as string);

            if (localInvoice) {
                await updateBusinessPaymentStatus(localInvoice.businessId, BusinessPaymentStatus.blocked);
            }
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;

            if (session.mode === 'setup' && session.customer) {
                const business = await getBusinessByStripeCustomerId(session.customer as string);

                if (business) {
                    await updateBusinessPaymentStatus(business.id, BusinessPaymentStatus.goodStanding);
                }
            }
        }

        res.status(200).json({received: true});
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}
