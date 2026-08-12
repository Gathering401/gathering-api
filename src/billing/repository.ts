import knex from 'knex';

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];
import {
    mapChargeLedgerEntryToDb,
    mapBusinessInvoiceToDb,
    mapBusinessInvoiceFromDb,
    ChargeLedgerEntry,
    UnbilledEventRow,
    UnsweptLedgerRow,
    BusinessInvoice,
} from "./types";
import {RsvpStatus} from "../common/enums/rsvpStatus";
import {BusinessInvoiceStatus} from "../common/enums/businessInvoiceStatus";

const database = knex(connection);

export const selectUnbilledCompletedEvents = async (): Promise<UnbilledEventRow[]> => {
    return database
        .table('event as e')
        .join('business_invitation as bi', 'bi.id', 'e.business_invitation_id')
        .join('business as b', 'b.id', 'bi.business_id')
        .leftJoin('business_charge_ledger as bcl', 'bcl.event_id', 'e.id')
        .whereNotNull('e.business_invitation_id')
        .andWhere('e.date', '<', database.fn.now())
        .whereNull('bcl.id')
        .select(
            'e.id as event_id',
            'bi.id as business_invitation_id',
            'b.id as business_id',
            'b.average_cost as average_cost',
            database('event_invitation as ei')
                .count('*')
                .where('ei.event_id', database.raw('event.id'))
                .andWhere('ei.rsvp_status', RsvpStatus.accepted)
                .as('rsvp_count')
        );
}

export const insertChargeLedgerEntries = async (entries: ChargeLedgerEntry[]): Promise<void> => {
    if (!entries.length) return;

    await database
        .table('business_charge_ledger')
        .insert(entries.map(mapChargeLedgerEntryToDb));
}

export const selectUnsweptLedgerRows = async (): Promise<UnsweptLedgerRow[]> => {
    return database
        .table('business_charge_ledger as bcl')
        .join('business as b', 'b.id', 'bcl.business_id')
        .join('business_invitation as bi', 'bi.id', 'bcl.business_invitation_id')
        .whereNull('bcl.invoice_id')
        .select(
            'bcl.id as ledger_id',
            'bcl.business_id',
            'bcl.business_invitation_id',
            'bcl.rsvp_count',
            'bcl.amount',
            'b.stripe_customer_id',
            'bi.name as business_invitation_name'
        );
}

export const selectOpenInvoiceBusinessIds = async (): Promise<number[]> => {
    const rows = await database
        .table('business_invoice')
        .where('status', BusinessInvoiceStatus.open)
        .distinct('business_id');

    return rows.map((row: { business_id: number }) => row.business_id);
}

export const insertBusinessInvoice = async (invoice: BusinessInvoice): Promise<BusinessInvoice[]> => {
    const rows = await database
        .table('business_invoice')
        .insert(mapBusinessInvoiceToDb(invoice))
        .returning(['id', 'business_id', 'stripe_invoice_id', 'amount', 'status']);

    return rows.map(mapBusinessInvoiceFromDb);
}

export const updateLedgerRowsInvoiceId = async (ledgerIds: number[], invoiceId: number): Promise<void> => {
    if (!ledgerIds.length) return;

    await database
        .table('business_charge_ledger')
        .whereIn('id', ledgerIds)
        .update({invoice_id: invoiceId});
}

export const selectBusinessInvoiceByStripeId = async (stripeInvoiceId: string): Promise<BusinessInvoice | undefined> => {
    const rows = await database
        .table('business_invoice')
        .where('stripe_invoice_id', stripeInvoiceId)
        .select('id', 'business_id', 'stripe_invoice_id', 'amount', 'status');

    if (!rows.length) return undefined;

    return mapBusinessInvoiceFromDb(rows[0]);
}

export const updateBusinessInvoiceStatus = async (id: number, status: number): Promise<void> => {
    await database
        .table('business_invoice')
        .where('id', id)
        .update({status});
}

export const updateBusinessPaymentStatus = async (businessId: number, status: number): Promise<void> => {
    await database
        .table('business')
        .where('id', businessId)
        .update({payment_status: status});
}

export const selectOpenInvoiceForBusiness = async (businessId: number) => {
    return database
        .table('business_invoice')
        .where({business_id: businessId, status: BusinessInvoiceStatus.open})
        .first();
}
