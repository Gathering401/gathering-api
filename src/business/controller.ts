import jwt from 'jsonwebtoken';

import {Request, Response} from 'express';
import {
    getBusinessByEmail,
    getBusinessInvitationsByBusinessId,
    postBusiness,
    postBusinessInvitation,
    selectAnalytics,
    selectCompareIds,
    demoteActiveInvitations,
    gatherUsers,
    gatherCampaigns,
    getUserBeenInvited,
    getEligibleGroupsForUser,
    createBusinessInvitationRecipient,
    isUserWithinInvitationRadius, getPushSlotRecipients, cancelBusinessInvitation, getBusinessPaymentStatus,
    updateBusinessStripeCustomerId
} from "./repository";
import {encryptPassword} from "../auth/controller";
import {
    Business, CampaignMatch, DbAnalytics,
    mapDbBusinessInvitationToBusinessInvitation,
    mapRequestBodyToBusinessInvitation, mapToAnalytics
} from "./types";
import {sendPushNotification} from "../notifications";
import {BusinessPaymentStatus} from "../common/enums/businessPaymentStatus";
import {selectOpenInvoiceForBusiness} from "../billing/repository";
import {mapBusinessInvoiceFromDb} from "../billing/types";
import {createSetupCheckoutSession, createStripeCustomer} from "../billing/stripe";

export const generateBusinessAccessToken = (businessId: number, contactEmail: string) =>
    jwt.sign({ type: 'business', businessId, contactEmail }, process.env.HASH_SECRET as string, { expiresIn: '24h' });

export const verifyBusinessAccessToken = (accessToken: string) => {
    try {
        const decoded = jwt.verify(accessToken, process.env.HASH_SECRET as string) as any;

        if (decoded.type !== 'business') {
            return null;
        }

        return decoded as { type: 'business', businessId: number, contactEmail: string };
    } catch (err) {
        console.log('verify error:', err);
        return null;
    }
}

export const signupBusiness = async (req: Request, res: Response) => {
    try {
        const {name, category, contactEmail, contactPhone, averageCost, password} = req.body as Business;

        const existing = await getBusinessByEmail(contactEmail);

        if (existing) {
            return res.status(409).json({success: false, message: 'A business with this email already exists'});
        }

        const passwordHash = encryptPassword(password);

        const business = await postBusiness(name, category, contactEmail, contactPhone ?? null, averageCost, passwordHash);

        const stripeCustomer = await createStripeCustomer(name, contactEmail);
        await updateBusinessStripeCustomerId(business.id, stripeCustomer.id);

        const frontendUrl = process.env.FRONTEND_URL as string;
        const checkoutSession = await createSetupCheckoutSession(stripeCustomer.id, frontendUrl, frontendUrl);

        const accessToken = generateBusinessAccessToken(business.id, business.contact_email);

        res.status(201).json({
            success: true,
            response: business,
            accessToken,
            checkoutUrl: checkoutSession.url
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const loginBusiness = async (req: Request, res: Response) => {
    try {
        const {contactEmail, password} = req.body;

        const business = await getBusinessByEmail(contactEmail);

        if (!business) {
            return res.status(401).json({success: false, message: 'Invalid email or password'});
        }

        const passwordHash = encryptPassword(password);

        if (passwordHash !== business.password_hash) {
            return res.status(401).json({success: false, message: 'Invalid email or password'});
        }

        const accessToken = generateBusinessAccessToken(business.id, business.contact_email);

        res.status(200).json({
            success: true,
            response: {
                id: business.id,
                name: business.name,
                category: business.category,
                contactEmail: business.contact_email,
                contactPhone: business.contact_phone
            },
            accessToken
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const createInvitation = async (req: Request, res: Response) => {
    try {
        const paymentStatus = await getBusinessPaymentStatus(res.locals.businessId);

        if (paymentStatus === BusinessPaymentStatus.blocked) {
            const openInvoice = await selectOpenInvoiceForBusiness(res.locals.businessId);

            res.status(402).json({
                success: false,
                error: 'Account is blocked pending payment. Please resolve your account balance to create new campaigns.',
                invoiceId: openInvoice?.id ?? null,
                hostedInvoiceUrl: openInvoice?.hosted_invoice_url ?? null
            });
            return;
        }

        const businessInvitation = mapRequestBodyToBusinessInvitation(res.locals.businessId, req.body);

        const [invitation] = await postBusinessInvitation(businessInvitation);

        res.status(201).json({
            success: true,
            response: mapDbBusinessInvitationToBusinessInvitation(invitation)
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const listInvitations = async (req: Request, res: Response) => {
    try {
        const businessId = res.locals.businessId;
        const status = req.query.status ? Number(req.query.status) : undefined;

        const invitations = await getBusinessInvitationsByBusinessId(businessId, status);

        res.status(200).json({
            success: true,
            response: invitations.map(mapDbBusinessInvitationToBusinessInvitation)
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const { invitationId, timeframe } = req.query;

        if(!invitationId) {
            return res.status(400).json({
                success: false,
                error: 'Missing invitation ID'
            });
        }

        const response = await selectAnalytics([Number(invitationId)]) as any as DbAnalytics[];

        let previous: DbAnalytics[] = [];
        if(timeframe) {
            const ids = await selectCompareIds(Number(invitationId), Number(timeframe));
            previous = await selectAnalytics(ids.map(({id}) => id)) as any as DbAnalytics[];
        }

        const previousMapped = [];
        for(let i = 0; i < previous.length; i+=2) {
            previousMapped.push(previous.slice(i, i+2));
        }

        res.status(200).json({
            success: true,
            response: {
                current: mapToAnalytics(response),
                previous: previousMapped.map(mapToAnalytics)
            }
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const createInvitations = async () => {
    await demoteActiveInvitations();

    const users = await gatherUsers();
    const campaigns = await gatherCampaigns();

    const matchingCampaigns = new Map<number, CampaignMatch[]>();

    for (const user of users) {
        const currentMatches = matchingCampaigns.get(user.id) ?? [];

        for (const campaign of campaigns) {
            const alreadyBeenInvited = await getUserBeenInvited(campaign.id!, user.id);
            if (alreadyBeenInvited) continue;

            const groupCount = await getEligibleGroupsForUser(user.id, campaign);
            if (!groupCount) continue;

            const isDistanceEligible = await isUserWithinInvitationRadius(user.id, campaign.id!);
            if (!isDistanceEligible) continue;

            currentMatches.push({ id: campaign.id!, groupCount });
        }

        currentMatches.sort((a, b) => b.groupCount - a.groupCount);
        matchingCampaigns.set(user.id, currentMatches);
    }

    const sortedUsers = Array.from(matchingCampaigns).sort((a, b) => a[1].length - b[1].length);

    for (const [userId, matches] of sortedUsers) {
        if (!matches.length) continue;

        const topMatches = matches.slice(0, 3);
        for (const [index, match] of topMatches.entries()) {
            await createBusinessInvitationRecipient(match.id, userId, index + 1);
        }
    }

    const pushRecipients = await getPushSlotRecipients();

    for (const recipient of pushRecipients) {
        try {
            await sendPushNotification(
                recipient.expo_push_token,
                recipient.name,
                recipient.description,
                {invitationId: recipient.invitation_id}
            );
        } catch (err) {
            console.error('push send failed', err);
        }
    }
}

export const cancelInvitation = async (req: Request, res: Response) => {
    try {
        const {invitationId} = req.query;
        const businessId = res.locals.businessId;

        const updated = await cancelBusinessInvitation(Number(invitationId), businessId);

        if (!updated) {
            return res.status(404).json({ success: false, error: 'Invitation not found' });
        }

        res.status(200).json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

export const getPaymentStatus = async (_: Request, res: Response) => {
    try {
        const paymentStatus = await getBusinessPaymentStatus(res.locals.businessId);

        res.status(200).json({
            success: true,
            response: {paymentStatus}
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const getOpenInvoice = async (_: Request, res: Response) => {
    try {
        const invoice = await selectOpenInvoiceForBusiness(res.locals.businessId);

        res.status(200).json({
            success: true,
            response: invoice ? mapBusinessInvoiceFromDb(invoice) : null
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}
