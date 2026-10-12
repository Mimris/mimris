'use client';
import { createSelectionInspector } from '@mimris/modelling-editor/selection-inspector';
import * as runtime from '../../../akmm/metamodeller';
import * as common from '../../../akmm/ui_common';
import * as templates from '../../../akmm/ui_templates';
import * as utilities from '../../../akmm/utilities';
import * as constants from '../../../akmm/constants';
import { isAppearanceField } from '../../../akmm/viewAppearance';

// Stable standalone adapter; reusable inspector code does not import application modules.
export const SelectionInspector = createSelectionInspector({ runtime, common, templates, utilities, constants, isAppearanceField });
