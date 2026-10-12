import { createCanvasHostServices } from '@mimris/modelling-editor';
import * as akm from '../akmm/metamodeller';
import * as gjs from '../akmm/ui_gojs';
import * as jsn from '../akmm/ui_json';
import * as uic from '../akmm/ui_common';
import * as uid from '../akmm/ui_diagram';
import * as uim from '../akmm/ui_modal';
import * as uit from '../akmm/ui_templates';
import * as utils from '../akmm/utilities';
import * as constants from '../akmm/constants';

export const standaloneCanvasHostServices = createCanvasHostServices({ akm, gjs, jsn, uic, uid, uim, uit, utils, constants });
