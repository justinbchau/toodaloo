import React, { createContext, useState } from 'react';

// A plain lat/lng point. `center` is the app's *active point of interest* — the
// place the map is browsing and the origin distances are measured from. It equals
// the device's GPS fix by default, but a location search repoints it at the
// searched coordinates (and clearing the search restores GPS). Modeling it as a
// bare Coord — rather than a full expo-location LocationObject — keeps searched
// centers honest: they aren't device readings and shouldn't have to fake one.
export type Coord = { lat: number; lng: number };

type Props = {
    children: React.ReactNode;
};

type LocationContextType = {
    center: Coord | null;
    setCenter: React.Dispatch<React.SetStateAction<Coord | null>>;
};

export const LocationCtx = createContext<LocationContextType>({
    center: null,
    setCenter: () => {},
});

export const ContextStore = (props: Props) => {
    const [center, setCenter] = useState<Coord | null>(null);

    return (
        <LocationCtx.Provider value={{ center, setCenter }}>
            {props.children}
        </LocationCtx.Provider>
    );
};
