/** Versioned built-ins are read-only; edits become independent personal copies. */
import { type TemplateVersion } from './templates.ts';
export declare function builtinTemplates(): TemplateVersion[];
export declare function getBuiltinTemplate(id: string, version?: number): TemplateVersion;
