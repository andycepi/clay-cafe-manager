import { Piece } from '../types';

export interface PaymentStatus {
  totalClay: number;
  totalGlaze: number;
  pieces: Piece[];
}

export const calculateCustomerPaymentStatus = (pieces: Piece[]): PaymentStatus => {
  const totalClay = 0; // Clay payment tracking removed as per existing code
  const totalGlaze = pieces.reduce((sum, piece) => {
    return sum + (piece.paidGlaze ? 0 : (piece.glazeTotal || 0));
  }, 0);
  
  return {
    totalClay,
    totalGlaze,
    pieces
  };
};

export const calculateTotalOwed = (pieces: Piece[]): number => {
  return pieces.reduce((sum, piece) => {
    return sum + (piece.paidGlaze ? 0 : (piece.glazeTotal || 0));
  }, 0);
};

export const isPaidInFull = (pieces: Piece[]): boolean => {
  return pieces.every(piece => piece.paidGlaze);
};