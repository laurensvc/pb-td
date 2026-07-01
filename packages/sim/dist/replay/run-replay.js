import { SIM_HZ } from '../constants.js';
import { RoundController, resetEntityIdCounter } from '../round/round-controller.js';
function executeStep(controller, step) {
    switch (step.type) {
        case 'skipCountdown':
            controller.skipCountdown();
            return;
        case 'place': {
            const result = controller.placeCandidate(step.gx, step.gy);
            if (!result.ok) {
                throw new Error(`Replay place (${step.gx},${step.gy}) failed: ${result.reason}`);
            }
            return;
        }
        case 'keep': {
            const candidate = controller.candidates[step.candidateIndex ?? 0];
            if (!candidate) {
                throw new Error(`Replay keep: candidate index ${step.candidateIndex ?? 0} missing`);
            }
            controller.resolveSelection({ kind: 'keep', candidateId: candidate.id });
            return;
        }
        case 'tick':
            for (let i = 0; i < step.count; i++) {
                controller.tick(1 / SIM_HZ);
            }
            return;
        case 'tickUntilPhase': {
            let ticks = 0;
            while (controller.phase !== step.phase && ticks < step.maxTicks) {
                controller.tick(1 / SIM_HZ);
                ticks++;
            }
            if (controller.phase !== step.phase) {
                throw new Error(`Replay timed out waiting for phase ${step.phase} (stuck in ${controller.phase})`);
            }
            return;
        }
        default: {
            const _exhaustive = step;
            throw new Error(`Unknown replay step: ${JSON.stringify(_exhaustive)}`);
        }
    }
}
export function runReplay(content, script) {
    resetEntityIdCounter();
    const controller = new RoundController(content, {
        seed: script.seed,
        routeId: script.routeId,
    });
    for (const step of script.steps) {
        executeStep(controller, step);
    }
    return controller;
}
