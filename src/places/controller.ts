import { Request, Response } from 'express';
import { autocompletePlaces, getPlaceDetails } from './repository';

export const getAutocomplete = async (req: Request, res: Response) => {
    try {
        const { input, sessionToken } = req.query;

        const results = await autocompletePlaces(String(input), String(sessionToken));

        res.status(200).json(results);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Something went wrong' });
    }
}

export const getDetails = async (req: Request, res: Response) => {
    try {
        const { placeId, sessionToken } = req.query;

        const result = await getPlaceDetails(String(placeId), String(sessionToken));

        res.status(200).json(result);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Something went wrong' });
    }
}
