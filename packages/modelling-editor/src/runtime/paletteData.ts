/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSPaletteApp module. */
// Palette runtime data helpers. Inputs are detached, mutable runtime data, not Redux snapshots.
function isBooleanLikeKey(key: string): boolean {
  return /^(is[A-Z_]|has[A-Z_]|can[A-Z_]|allow[A-Z_]|show[A-Z_]|include[A-Z_])/.test(key) ||
    key === "visible" ||
    key === "readOnly" ||
    key === "markedAsDeleted" ||
    key === "selectable" ||
    key === "deletable" ||
    key === "reshapable" ||
    key === "resegmentable" ||
    key === "relinkableFrom" ||
    key === "relinkableTo" ||
    key === "avoidable" ||
    key === "shadowVisible";
}

export function normalizeEmptyBooleanFieldsInPlace(value: any, seen = new WeakSet<object>()): any {
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return value;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item) => normalizeEmptyBooleanFieldsInPlace(item, seen));
    return value;
  }
  Object.keys(value).forEach((key) => {
    const current = value[key];
    if (isBooleanLikeKey(key) && (current === "" || current === null)) {
      value[key] = false;
      return;
    }
    if (current && typeof current === "object") {
      normalizeEmptyBooleanFieldsInPlace(current, seen);
    }
  });
  return value;
}

export function normalizePaletteNodeCategoryData(nodeDataArray: any[] | undefined): any[] {
  if (!Array.isArray(nodeDataArray)) return nodeDataArray as any;
  return nodeDataArray.map((node) => {
    if (!node || typeof node !== 'object') return node;
    normalizeEmptyBooleanFieldsInPlace(node);
    const category = node.category || node.template || 'textAndIcon';
    if (typeof category === 'string' && category.length > 0 && node.category === category) {
      return node;
    }
    return {
      ...node,
      category,
    };
  });
}

export function normalizePaletteLinkData(linkDataArray: any[] | undefined): any[] {
  if (!Array.isArray(linkDataArray)) return linkDataArray as any;
  return linkDataArray.map((link) => {
    if (!link || typeof link !== "object") return link;
    normalizeEmptyBooleanFieldsInPlace(link);
    return {
      ...link,
      category: ''
    };
  });
}

function arePaletteValuesEqual(left: any, right: any): boolean {
  if (left === right) return true;
  if (typeof left === 'number' && typeof right === 'number' && Number.isNaN(left) && Number.isNaN(right)) {
    return true;
  }
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') {
    return false;
  }
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  for (let i = 0; i < leftKeys.length; i++) {
    const key = leftKeys[i];
    if (!Object.prototype.hasOwnProperty.call(right, key)) return false;
    if (left[key] !== right[key]) return false;
  }
  return true;
}

export function arePaletteArraysEquivalent(left: any[] | undefined, right: any[] | undefined): boolean {
  if (left === right) return true;
  const leftArr = Array.isArray(left) ? left : [];
  const rightArr = Array.isArray(right) ? right : [];
  if (leftArr.length !== rightArr.length) return false;
  for (let i = 0; i < leftArr.length; i++) {
    if (!arePaletteValuesEqual(leftArr[i], rightArr[i])) {
      return false;
    }
  }
  return true;
}
