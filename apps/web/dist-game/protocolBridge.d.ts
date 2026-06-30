import type { ValidatedCommand } from '@facet/protocol';
import type { GameAction, GameState, UiFeedback } from './types';
export declare function protocolCommandToActions(command: ValidatedCommand): GameAction[];
export declare function applyProtocolCommand(state: GameState, command: ValidatedCommand): UiFeedback;
