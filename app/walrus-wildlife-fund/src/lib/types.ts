export interface Dataset {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  rentPrice?: string;
  size: string;
  format: string;
  downloads: number;
  expiresIn: string;
  seller: string;
  verified: boolean;
  tags: string[];
}

export interface Stat {
  label: string;
  value: string;
}
