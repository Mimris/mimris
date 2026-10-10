'use client';
import { createPaletteWrapper } from '../../../../packages/modelling-editor/dist/components/Palette.js';
import * as diagram from '../../../akmm/ui_diagram';
import * as templates from '../../../akmm/ui_templates';

export const PaletteWrapper = createPaletteWrapper({ diagram, templates });
