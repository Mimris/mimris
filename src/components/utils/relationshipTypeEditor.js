const definitionFields = ['name', 'description', 'fromobjtypeRef', 'toobjtypeRef', 'cardinalityFrom', 'cardinalityTo', 'nameFrom', 'nameTo'];
const appearanceFields = ['strokecolor', 'strokewidth', 'dash', 'fromArrow', 'toArrow'];

export function createRelationshipTypeDraft(type) {
  const view = type.typeview;
  const data = view?.getData?.() || view?.data || view || {};
  const draft = Object.fromEntries(definitionFields.map(key => [key, type[key] ?? '']));
  // Imported legacy types may have repaired runtime endpoints and stale raw refs.
  draft.fromobjtypeRef = type.fromObjtype?.id || draft.fromobjtypeRef;
  draft.toobjtypeRef = type.toObjtype?.id || draft.toobjtypeRef;
  Object.assign(draft, {
    strokecolor: view?.getStrokecolor?.() || data.strokecolor || 'black',
    strokewidth: view?.getStrokewidth?.() ?? data.strokewidth ?? 1,
    dash: view?.getDash?.() || data.dash || 'None',
    fromArrow: view?.getFromArrow?.() || data.fromArrow || '',
    toArrow: view?.getToArrow?.() || data.toArrow || '',
  });
  for (const key of ['fromArrow', 'toArrow']) {
    if (draft[key] === 'None' || !draft[key].trim()) draft[key] = '';
  }
  return draft;
}

export function isValidCardinality(value) {
  const text = String(value ?? '').trim();
  if (text === '' || text === '*') return true;
  const match = /^(\d+)(?:\.\.(\d+|\*))?$/.exec(text);
  if (!match) return false;
  const lower = Number(match[1]);
  const upper = match[2] === '*' ? Infinity : Number(match[2] ?? match[1]);
  return Number.isSafeInteger(lower) && (upper === Infinity || Number.isSafeInteger(upper)) && lower <= upper;
}

export function validateRelationshipTypeDraft(draft, objectTypes) {
  /** @type {Record<string, string>} */
  const errors = {};
  if (!String(draft.name || '').trim()) errors.name = 'Enter a relationship name.';
  for (const [key, label] of [['fromobjtypeRef', 'source'], ['toobjtypeRef', 'target']]) {
    if (!objectTypes.some(type => type.id === draft[key] && !type.markedAsDeleted)) errors[key] = `Choose an existing ${label} object type.`;
  }
  for (const key of ['cardinalityFrom', 'cardinalityTo']) {
    if (!isValidCardinality(draft[key])) errors[key] = 'Use a number, *, or a range such as 0..1 or 1..*.';
  }
  const width = Number(draft.strokewidth);
  if (!Number.isFinite(width) || width <= 0) errors.strokewidth = 'Enter a positive line width.';
  if (!String(draft.strokecolor || '').trim()) errors.strokecolor = 'Enter a line color.';
  return errors;
}

// Keep this operation independent of React so validation and runtime updates
// share the same rules. Serialization/dispatch remains with the diagram caller.
export function applyRelationshipTypeDraft(type, draft, objectTypes) {
  const errors = validateRelationshipTypeDraft(draft, objectTypes);
  if (Object.keys(errors).length) return { errors };
  const from = objectTypes.find(item => item.id === draft.fromobjtypeRef);
  const to = objectTypes.find(item => item.id === draft.toobjtypeRef);
  const oldFrom = type.fromObjtype;
  const oldTo = type.toObjtype;
  if (oldFrom && oldFrom.id !== from.id) oldFrom.outputreltypes = (oldFrom.outputreltypes || []).filter(item => item.id !== type.id);
  if (oldTo && oldTo.id !== to.id) oldTo.inputreltypes = (oldTo.inputreltypes || []).filter(item => item.id !== type.id);
  for (const key of definitionFields) type[key] = String(draft[key] ?? '').trim();
  type.fromObjtype = from;
  type.toObjtype = to;
  // Keep endpoint membership correct even for legacy empty adjacency lists.
  from.outputreltypes ||= [];
  to.inputreltypes ||= [];
  if (!from.outputreltypes.some(item => item.id === type.id)) from.outputreltypes.push(type);
  if (!to.inputreltypes.some(item => item.id === type.id)) to.inputreltypes.push(type);
  type.modified = true;
  const view = type.typeview || type.newDefaultTypeView(type.relshipkind);
  const data = view.getData?.() || view.data || {};
  for (const key of appearanceFields) {
    const value = key === 'strokewidth' ? Number(draft[key]) : draft[key];
    data[key] = value;
    view[key] = value;
  }
  view.data = data;
  view.modified = true;
  return { errors: {}, type, view };
}
