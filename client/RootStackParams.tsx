export type RootStackParamList = {
  ToodaLoo: undefined;
  Auth: { screen: string } | undefined;
  // Accepts an optional screen param so callers can land on a specific tab.
  // e.g. navigation.navigate('MainTabs', { screen: 'Map' })
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
  BathroomDetail: { id: string; name: string; lat: number; lng: number };
  WriteReview: { bathroomId: string; bathroomName: string };
  Success: undefined;
};

export type MainTabParamList = {
  Map: undefined;
  Saved: undefined;
  Add: undefined;
  Profile: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  MyReviews: undefined;
  Submitted: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: { title: string; page: string } | undefined;
  Confirmation: { email: string } | undefined;
};
