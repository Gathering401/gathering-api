import { PlaceAutocompleteResult, PlaceDetailsResult } from './types';

const PLACES_API_KEY = process.env.GOOGLE_PLACES_SERVER_KEY as string;

export const autocompletePlaces = async (
    input: string,
    sessionToken: string
): Promise<PlaceAutocompleteResult[]> => {
    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': PLACES_API_KEY,
            'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text'
        },
        body: JSON.stringify({
            input,
            sessionToken,
            includedRegionCodes: ['us']
        })
    });

    const data = await response.json();

    if (!data.suggestions) {
        return [];
    }

    return data.suggestions.map((suggestion: any) => ({
        placeId: suggestion.placePrediction.placeId,
        description: suggestion.placePrediction.text.text
    }));
}

export const getPlaceDetails = async (
    placeId: string,
    sessionToken: string
): Promise<PlaceDetailsResult> => {
    const response = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}?sessionToken=${sessionToken}`,
        {
            headers: {
                'X-Goog-Api-Key': PLACES_API_KEY,
                'X-Goog-FieldMask': 'location,formattedAddress'
            }
        }
    );

    const data = await response.json();

    return {
        lat: data.location.latitude,
        lng: data.location.longitude,
        formattedAddress: data.formattedAddress
    }
}
