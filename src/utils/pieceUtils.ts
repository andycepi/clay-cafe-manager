import { Piece } from '../types';
import { database } from '../data/database';

export const updatePieceGlazeTotal = async (piece: Piece): Promise<Piece> => {
  if (!piece.cubicInches || piece.cubicInches <= 0) {
    return {
      ...piece,
      glazeTotal: 0
    };
  }

  try {
    const glazeTotal = await database.calculateGlazePrice(piece.cubicInches);
    return {
      ...piece,
      glazeTotal
    };
  } catch (error) {
    console.error('Error calculating glaze price:', error);
    return piece;
  }
};

export const recalculateAllPieceGlazeTotals = async (pieces: Piece[]): Promise<Piece[]> => {
  const updatedPieces = await Promise.all(
    pieces.map(piece => updatePieceGlazeTotal(piece))
  );
  return updatedPieces;
};