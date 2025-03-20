// @ts-nocheck
// akm_globals.js

'use strict';

import * as akm from './metamodeller';
import * as gjs from './ui_gojs';

// Define globals

const akm_globals = {

    metis           : null,
    doit            : false,
    myMetamodel     : akm.cxMetaModel,
    myModel         : akm.cxModel,
    myModelView     : akm.cxModelView,
    myDiagram       : "",
    myDiagram2      : "",
    myGoModel       : gjs.goModel,
    myGoMetaModel   : gjs.goModel,
    myNode          : gjs.goNode,
    myGql           : "",
    initiated       : false,
    initiated2      : false,
    firsttime       : false,
    logged_in       : false,
    myPalette       : gjs.paletteNode,
    myMetaPalette   : gjs.paletteNode,
    myPaletteModel  : "",
    pasteViewsOnly  : false,
    deleteViewsOnly : false

}

export default akm_globals;

