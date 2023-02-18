// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/
const debug = false;
const linkToLink = false;

import * as go from 'gojs';

const $ = go.GraphObject.make; 
if (debug) console.log('ui_menus.ts');
export function makeButton(text: string, action: any, visiblePredicate: any) {
    return $("ContextMenuButton",
      $(go.TextBlock, text),
      { click: action },
      // don't bother with binding GraphObject.visible if there's no predicate
      visiblePredicate ? new go.Binding("visible", "",
        function (o, e) {
          return o.diagram ? visiblePredicate(o, e) : false;
        }).ofObject() : {}
    );
  }


  
