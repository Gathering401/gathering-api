import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const createCampaignInvoiceItem = async (customerId: string, amountCents: number, description: string): Promise<void> => {
    await stripe.invoiceItems.create({
        customer: customerId,
        amount: amountCents,
        currency: 'usd',
        description,
    });
}

export const createAndFinalizeInvoice = async (customerId: string): Promise<Stripe.Invoice> => {
    const invoice = await stripe.invoices.create({
        customer: customerId,
        auto_advance: true,
        collection_method: 'charge_automatically',
    });

    return stripe.invoices.finalizeInvoice(invoice.id as string);
}

export const createStripeCustomer = async (name: string, email: string): Promise<Stripe.Customer> => {
    return stripe.customers.create({
        name,
        email,
    });
}

export const createSetupCheckoutSession = async (customerId: string, successUrl: string, cancelUrl: string): Promise<Stripe.Checkout.Session> => {
    return stripe.checkout.sessions.create({
        mode: 'setup',
        customer: customerId,
        payment_method_types: ['us_bank_account'],
        success_url: successUrl,
        cancel_url: cancelUrl,
    });
}

export const verifyWebhookEvent = (payload: Buffer, signature: string): Stripe.Event => {
    return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET as string);
}
