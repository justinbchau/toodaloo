import React from 'react'
import { ScrollView } from 'react-native'
import { Image, Text, Div, Button, Icon, Tag } from 'react-native-magnus'
import { AirbnbRating } from 'react-native-ratings'

export function ModalItem() {
    const ratingCompleted = (rating: any) => {
        console.log("Rating is: " + rating)
    }
    return (
        <>
            {/* Image Carousel */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Div row>
                    {Array.from({ length: 4 }).map(() => (
                        <Image
                            h={128}
                            w={160}
                            mt={16}
                            ml={14}
                            rounded="lg"
                            source={{
                                uri:
                                    "https://images.unsplash.com/photo-1593642532400-2682810df593?ixid=MXwxMjA3fDF8MHxlZGl0b3JpYWwtZmVlZHwxfHx8ZW58MHx8fA%3D%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
                            }}
                        />
                    ))}
                </Div>
            </ScrollView>
            {/* Title */}
            <Div ml="lg" mt="xl">
                <Text fontSize="2xl">1. Park Restroom</Text>
            </Div>
            {/* Rating */}
            <Div row ml="lg" mt="sm">
                <AirbnbRating
                    count={5}
                    size={15}
                    showRating={false}
                    onFinishRating={() => ratingCompleted}
                />
            </Div>
            <Div row ml="lg" mt="md" justifyContent='flex-start'>
                <Tag mr="md" px='md' py="sm" bg='gray200' fontSize="xs" rounded="circle">Free</Tag>
                <Tag mr="md" px='md' py="sm" bg='gray200' fontSize="xs" rounded="circle">Multiple Stalls</Tag>
                <Tag mr="md" px='md' py="sm" bg='gray200' fontSize="xs" rounded="circle">Mirrors</Tag>
            </Div >
            {/* Address  & */}
            <Div ml="lg" mt="lg">
                <Text>
                    123 Park Ave
                </Text>
                <Div row alignItems='center'>
                    <Text>
                        San Francisco, CA
                    </Text>
                    <Tag ml={10} px='md' py="sm" bg='gray100' fontSize="xs" rounded="md">0.6 mi</Tag>
                </Div>
            </Div>
            <Div>
                <Button
                    block={true}
                    mt="xl"
                    mx="lg"
                    px='xl'
                    py='md'
                    bg='transparent'
                    color='purp_primary'
                    shadow="3xl"
                    borderColor="purp_primary"
                    borderWidth={2}
                    mb={20}
                    fontSize="2xl"
                >
                    Map
                </Button>
            </Div>
            <Div mt={20} h={1} bg="gray400"></Div>
        </>
    )
}