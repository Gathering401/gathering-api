export interface ChargeLedgerEntry {
    id?: number;
    businessId: number;
    businessInvitationId: number;
    eventId: number;
    rsvpCount: number;
    unitPrice: number;
    amount: number;
    invoiceId: number | null;
}

export interface ChargeLedgerEntryRow {
    id?: number;
    business_id: number;
    business_invitation_id: number;
    event_id: number;
    rsvp_count: number;
    unit_price: number;
    amount: number;
    invoice_id: number | null;
}

export interface UnbilledEventRow {
    event_id: number;
    business_invitation_id: number;
    business_id: number;
    average_cost: string;
    rsvp_count: string;
}

export const mapChargeLedgerEntryToDb = (entry: ChargeLedgerEntry): ChargeLedgerEntryRow => ({
    business_id: entry.businessId,
    business_invitation_id: entry.businessInvitationId,
    event_id: entry.eventId,
    rsvp_count: entry.rsvpCount,
    unit_price: entry.unitPrice,
    amount: entry.amount,
    invoice_id: entry.invoiceId,
});

export interface UnsweptLedgerRow {
    ledger_id: number;
    business_id: number;
    business_invitation_id: number;
    rsvp_count: string;
    amount: string;
    stripe_customer_id: string | null;
    business_invitation_name: string;
}

export interface BusinessInvoice {
    id?: number;
    businessId: number;
    stripeInvoiceId: string;
    hostedInvoiceUrl: string | null;
    amount: number;
    status: number;
}

export interface BusinessInvoiceRow {
    id?: number;
    business_id: number;
    stripe_invoice_id: string;
    hosted_invoice_url: string | null;
    amount: number;
    status: number;
}

export const mapBusinessInvoiceFromDb = (row: BusinessInvoiceRow): BusinessInvoice => ({
    id: row.id!,
    businessId: row.business_id,
    stripeInvoiceId: row.stripe_invoice_id,
    hostedInvoiceUrl: row.hosted_invoice_url,
    amount: row.amount,
    status: row.status,
});

export const mapBusinessInvoiceToDb = (invoice: BusinessInvoice): BusinessInvoiceRow => ({
    business_id: invoice.businessId,
    stripe_invoice_id: invoice.stripeInvoiceId,
    hosted_invoice_url: invoice.hostedInvoiceUrl,
    amount: invoice.amount,
    status: invoice.status,
});

export const RSVP_FEE_PERCENTAGE = 0.01;
