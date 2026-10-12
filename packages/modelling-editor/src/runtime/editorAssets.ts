export const bundledEditorAssetNames = [
  "E-Scooter.png",
  "Format.png",
  "Method.png",
  "Organisation1.png",
  "Organisation2.png",
  "OrganisationUnit.png",
  "ProcessModelFantasyWorld.png",
  "ProcessModelFantasyWorld2.png",
  "ProcessModelFantasyWorld2_landscape.png",
  "RegExp.png",
  "Select.png",
  "analyse.png",
  "automated.jfif",
  "blank.png",
  "book.png",
  "braces.svg",
  "bug.svg",
  "bullseye.svg",
  "car.png",
  "carpark.png",
  "chat-square-text.svg",
  "check-square-fill.svg",
  "check-square.svg",
  "default.png",
  "exclamation-triangle.svg",
  "exclusive.png",
  "file-earmark-image.svg",
  "folder-check.svg",
  "hand-thumbs-up.svg",
  "house-door.svg",
  "inboxes.svg",
  "inclusive.png",
  "info.svg",
  "layers.svg",
  "palette.svg",
  "parallel.png",
  "person-square.svg",
  "speedometer.svg",
  "task1.jfif",
  "tiger.svg",
  "ui-checks.svg",
  "x-octagon.svg",
  "youtube.svg"
] as const;
export const unresolvedEditorAssetNames = ["property.png"] as const;

/** Resolve known packaged identifiers; retain unknown/remote persisted values unchanged. */
export const resolveEditorAssetUrl = (value: string, assetBaseUrl = '/images/'): string => {
    const name = value.startsWith('/images/') ? value.slice(8) : value;
    if (!(bundledEditorAssetNames as readonly string[]).includes(name)) return value;
    return `${assetBaseUrl.replace(/\/$/, '')}/${name}`;
};
