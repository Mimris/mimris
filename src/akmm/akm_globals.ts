// @ts-nocheck
// akm_globals.js

'use strict';

// import {cxMetis} from './metamodeller';
// import go  from './ui_gojs';
import * as akm from './metamodeller';
import * as go from './ui_gojs';


// Define globals

const akm_globals = {

    metis           : akm.cxMetis,
    doit            : false,
    myMetamodel     : akm.cxMetaModel,
    myModel         : akm.cxModel,
    myModelView     : akm.cxModelView,
    myDiagram       : "",
    myDiagram2      : "",
    myGoModel       : go.goModel,
    myGoMetaModel   : go.goModel,
    myNode          : go.goNode,
    myGql           : "",
    initiated       : false,
    initiated2      : false,
    firsttime       : false,
    logged_in       : false,
    myPalette       : go.paletteNode,
    myMetaPalette   : go.paletteNode,
    myPaletteModel  : ""

}

export default akm_globals;

