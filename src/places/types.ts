export interface PlaceAutocompleteResult {
    placeId: string;
    description: string;
}

export interface PlaceDetailsResult {
    lat: number;
    lng: number;
    formattedAddress: string;
}
