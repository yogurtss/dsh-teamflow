import { type AdaptationPhase } from './adaptation-progress.ts';
export declare function AdaptationProgress({ phase, disabled, onOpen }: {
    phase: AdaptationPhase;
    disabled?: boolean;
    onOpen: () => void;
}): import("react").JSX.Element;
