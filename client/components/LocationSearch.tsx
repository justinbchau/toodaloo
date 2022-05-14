import React from 'react'
import { Div, Icon, Input } from 'react-native-magnus'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_PLACES_API_KEY } from '@env'

export default function LocationSearch() {

    return (
        <GooglePlacesAutocomplete
            placeholder='Search location'
            styles={{
                textInputContainer: {
                    borderRadius: 5,
                    marginLeft: 40,
                    paddingLeft: 10,
                    backgroundColor: '#fff',
                    shadowColor: '#000',
                    shadowOffset: { width: -2, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 3,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingTop: 2
                },
                textInput: {
                    height: 44,
                    backgroundColor: '#fff',
                    paddingTop: 10
                },
                listView: {
                    marginLeft: 40,
                },
                description: {
                    fontSize: 12
                }
            }}
            enablePoweredByContainer={false}
            renderLeftButton={() => <Icon name="search" color="black" fontFamily="Feather" fontSize="3xl" />}
            query={{
                key: GOOGLE_PLACES_API_KEY,
                language: 'en', // language of the results
            }}
            onPress={(data, details) => console.log(data, details)}
            onFail={(error) => console.error(error)}
        />
    )
}

