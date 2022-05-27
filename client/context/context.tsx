import React, { createContext, useRef } from 'react'
import { DrawerRef } from 'react-native-magnus'

interface AppContextInterface {
    drawerRef: DrawerRef | null;
}

type Props = {
    children: JSX.Element
}

const AppCtx = createContext<AppContextInterface | null>(null);


export const ContextStore = (props: Props) => {
    const drawerRef = useRef<DrawerRef>(null);
    return <AppCtx.Provider value={{ drawerRef }}>{props.children}</AppCtx.Provider>;
};
