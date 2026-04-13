import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSecretId() {
  return `Secret #${Math.floor(1000 + Math.random() * 9000)}`;
}

export const AREAS = [
  'Kaliganj',
  'Dhaka',
  'Chittagong',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Rangpur',
  'Mymensingh',
  'Gazipur',
  'Narayanganj'
];
