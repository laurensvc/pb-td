import { allBoardCells } from './hexGrid';
export function cellParity(q, r) {
    return (q + r) % 2 === 0 ? 'rock' : 'gem';
}
export function acceptsRock(q, r) {
    return cellParity(q, r) === 'rock';
}
export function acceptsGem(q, r) {
    return cellParity(q, r) === 'gem';
}
export function isOnBoard(q, r, boardW, boardH) {
    return q >= 0 && r >= 0 && q < boardW && r < boardH;
}
export function parityMatchesPlacement(q, r, kind) {
    return kind === 'rock' ? acceptsRock(q, r) : acceptsGem(q, r);
}
export function parityCells(boardW, boardH, parity) {
    return allBoardCells(boardW, boardH).filter((cell) => cellParity(cell.x, cell.y) === parity);
}
/** @deprecated Use parityCells */
export const checkerboardCells = parityCells;
