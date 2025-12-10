export interface User {
  id: number;
  phoneNumber: string;
  email:  string;
  names: string;
  surnames: string;
  address: string;
  imageProfile: string | null;
  fcmToken:  string | null;
}