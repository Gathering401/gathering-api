import jwt from 'jsonwebtoken';

import {Request, Response} from 'express';
import {
    getBusinessByEmail,
    getBusinessInvitationsByBusinessId,
    postBusiness,
    postBusinessInvitation
} from "./repository";
import {encryptPassword} from "../auth/controller";
import {Business, mapDbBusinessInvitationToBusinessInvitation, mapRequestBodyToBusinessInvitation} from "./Business";

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
        const {name, category, contactEmail, contactPhone, password} = req.body as Business;

        const existing = await getBusinessByEmail(contactEmail);

        if (existing) {
            return res.status(409).json({success: false, message: 'A business with this email already exists'});
        }

        const passwordHash = encryptPassword(password);

        const business = await postBusiness(name, category, contactEmail, contactPhone ?? null, passwordHash);

        const accessToken = generateBusinessAccessToken(business.id, business.contact_email);

        res.status(201).json({
            success: true,
            response: business,
            accessToken
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
