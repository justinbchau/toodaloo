import ActionSheet from "react-native-actions-sheet";
import React, { forwardRef, useRef } from "react";
import { TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import { Div, Button, Tag, Text } from 'react-native-magnus'
import { ModalItem } from "./ModalItem";
import { FilterButton } from "./FilterButton";

const data = [
    {
        title: 'Gender Neutral',
    },
    {
        title: 'Multi Stalls',
    },
    {
        title: 'Mirrors',
    },
    {
        title: 'Handicap',
    },
    {
        title: 'Keypad Locked',
    },
    {
        title: 'Baby friendly',
    },
]



export const Modal = forwardRef<ActionSheet>((props, ref) => {

    const openModal = () => {
        ref?.current?.snapToOffset(900)
    }

    const closeModal = () => {
        ref?.current?.hide()
    }

    return (
        <SafeAreaView>
            <ActionSheet
                ref={ref}
                gestureEnabled={true}
                bounceOnOpen={true}
                initialOffsetFromBottom={.4}
                drawUnderStatusBar={true}
            >
                <Div row mt={20} mx={10}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    >
                        <Tag onPress={openModal} rounded="circle" bg="white" borderWidth={1} borderColor="gray500" py="md" color="black" fontSize="xs" mr={10}>Open Modal</Tag>
                        {/* Start of loop */}
                        {data.map((item, index) => (
                            <Div key={index} >
                                <FilterButton onPress={closeModal} title={item.title} />
                            </Div>
                        ))}
                        {/* End of loop */}
                    </ScrollView>
                </Div>
                <Div mt={20}>
                    <Text fontSize="3xl" textAlign="center">Results</Text>
                    <Div mt={5} h={1} bg="gray400"></Div>
                </Div>

                <ScrollView
                    nestedScrollEnabled
                >
                    <Div mb={70} >
                        <ModalItem />
                        <ModalItem />
                        <ModalItem />
                        <ModalItem />
                    </Div>
                </ScrollView>
            </ActionSheet>
        </SafeAreaView>
    );
});