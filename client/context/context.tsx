import React, { createContext, useState } from 'react';
import { LocationObject } from 'expo-location';

type Props = {
    children: React.ReactNode;
};

type LocationContextType = {
    location: LocationObject | null;
    setLocation: React.Dispatch<React.SetStateAction<LocationObject | null>>;
};

export const LocationCtx = createContext<LocationContextType>({
    location: null,
    setLocation: () => {},
});

export const ContextStore = (props: Props) => {
    const [location, setLocation] = useState<null | LocationObject>(null);

    return (
        <LocationCtx.Provider value={{ location, setLocation }}>
            {props.children}
        </LocationCtx.Provider>
    );
};
