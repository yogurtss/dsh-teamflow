/** Optional iterative workflows; one-off setup and delivery stay outside loops. */
import { type TemplateVersion } from './templates.ts';
export declare const BUILTIN_LOOP_IDS: readonly ["builtin-operator-loop", "builtin-bugfix-loop"];
export declare function builtinLoopTemplates(language?: 'zh' | 'en'): TemplateVersion[];
