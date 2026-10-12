/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
export function getObjectTypesForDropLayout(myMetis: any) {
  if (!myMetis) {
    return [];
  }
  if (typeof myMetis.getObjectTypes === 'function') {
    const types = myMetis.getObjectTypes();
    if (Array.isArray(types)) {
      return types.slice();
    }
  }
  if (Array.isArray(myMetis.objecttypes)) {
    return myMetis.objecttypes.slice();
  }
  const metamodel = myMetis.currentMetamodel;
  if (metamodel && typeof metamodel.getObjectTypes === 'function') {
    const metaTypes = metamodel.getObjectTypes();
    if (Array.isArray(metaTypes)) {
      return metaTypes.slice();
    }
  }
  return [];
}

export function uniqueStringValues(values: any[]) {
  const result: string[] = [];
  const seen: Record<string, boolean> = Object.create(null);
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (value === undefined || value === null) continue;
    const key = String(value);
    if (seen[key]) continue;
    seen[key] = true;
    result.push(key);
  }
  result.sort();
  return result;
}

export function normalizeToKey(value: any) {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim().toLowerCase();
}

export function getNodeTypeRef(node: any) {
  if (!node || !node.data) {
    return undefined;
  }
  const data = node.data;
  return (
    data.objtypeRef ||
    data.typeRef ||
    (data.objecttype && (data.objecttype.typeRef || data.objecttype.id)) ||
    (data.object && (data.object.typeRef || (data.object.type && data.object.type.id))) ||
    (data.type && data.type.id) ||
    (data.objtype && data.objtype.id) ||
    data.objTypeRef ||
    undefined
  );
}
