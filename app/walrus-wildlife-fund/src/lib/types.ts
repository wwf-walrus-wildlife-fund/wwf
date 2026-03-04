export interface Dataset {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  size: string;
  format: string;
  downloads: number;
  expiresIn: string;
  seller: string;
  verified: boolean;
}

export interface Stat {
  label: string;
  value: string;
}

export interface UploadPayload {
  file: File;
  name: string;
  description: string;
  category: string;
  price: string;
  storageDays: number;
}
