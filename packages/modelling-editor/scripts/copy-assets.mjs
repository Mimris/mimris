import { copyFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
mkdirSync(new URL('../dist/components/', import.meta.url), { recursive: true });
copyFileSync(new URL('../src/components/RelationshipTypeEditor.module.css', import.meta.url), new URL('../dist/components/RelationshipTypeEditor.module.css', import.meta.url));

rmSync(new URL('../dist/assets/', import.meta.url), { recursive: true, force: true });
cpSync(new URL('../assets/', import.meta.url), new URL('../dist/assets/', import.meta.url), { recursive: true });
