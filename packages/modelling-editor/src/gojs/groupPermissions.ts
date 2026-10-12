/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
import * as go from 'gojs';
import { getEditorHost } from '../host/access.js';

export function getMetisModels(phData: any): any[] {
  return Array.isArray(phData?.metis?.models) ? phData.metis.models.filter(Boolean) : [];
}


export function groupAllowsGrab(
  group: go.Group | null | undefined,
  myModelview?: any,
  myMetis?: any
): boolean {
  if (!(group instanceof go.Group)) return false;
  const data: any = group.data || {};
  const storeState = getEditorHost(myMetis)?.getState();
  let storedObjview: any = null;
  const storeModels = getMetisModels(storeState?.phData);
  if (storeModels.length) {
    outer: for (let mi = 0; mi < storeModels.length; mi++) {
      const model = storeModels[mi];
      const modelviews = model?.modelviews || [];
      for (let mvi = 0; mvi < modelviews.length; mvi++) {
        const modelview = modelviews[mvi];
        const objectviews = modelview?.objectviews || [];
        for (let ovi = 0; ovi < objectviews.length; ovi++) {
          const candidate = objectviews[ovi];
          if (candidate?.id === data?.key || candidate?.id === data?.objviewRef) {
            storedObjview = candidate;
            break outer;
          }
        }
      }
    }
  }
  const objview =
    data.objectview ||
    myModelview?.findObjectView?.(data?.key) ||
    myMetis?.findObjectView?.(data?.objviewRef || data?.key) ||
    storedObjview;
  return (
    objview?.grabIsAllowed === true ||
    data?.grabIsAllowed === true ||
    (group as any)?.grabIsAllowed === true ||
    (group as any)?.objectview?.grabIsAllowed === true
  );
}
