import { type TemplateVersion } from './templates.ts';
export declare const templateLibraryRoot: (directory?: string) => string;
export declare function listTemplates(root: string): Promise<{
    templates: TemplateVersion[];
    warnings: string[];
}>;
export declare function getTemplate(root: string, id: string, version?: number): Promise<TemplateVersion>;
export declare function saveTemplate(root: string, definition: unknown, previous?: {
    id: string;
    version: number;
}): Promise<TemplateVersion>;
export declare function deleteTemplate(root: string, id: string, version: number): Promise<void>;
