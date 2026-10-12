/* Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
 * Retained from the source GoJSApp module. */
export function getSizeOptionsForType(typeName: string | undefined | null) {
  if (!typeName) {
    return undefined;
  }
  const normalized = typeName.toString().toLowerCase();
  switch (normalized) {
    case 'pool':
      return { minWidth: 1600, minHeight: 900 };
    case 'lane':
      return { minWidth: 1400, minHeight: 260 };
    case 'process':
      return { minWidth: 920, minHeight: 560, preferredWidth: 920, preferredHeight: 560 };
    default:
      return undefined;
  }
}

export function getDefaultRoutingForRelshipType(typeName: string | undefined | null, fallback: string) {
  const normalized = String(typeName || "").trim().toLowerCase();
  if ((normalized === "isfollowedby" || normalized === "triggers") && (!fallback || fallback === "Normal")) {
    return "AvoidsNodes";
  }
  return fallback || "Normal";
}
