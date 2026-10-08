/** Appearance is shared; topology, templates and layout remain view-local. */
export const OBJECT_APPEARANCE_FIELDS = [
    'fillcolor', 'fillcolor1', 'fillcolor2', 'strokecolor', 'strokecolor1', 'strokecolor2',
    'strokewidth', 'textcolor', 'textcolor2', 'textscale', 'arrowscale',
    'icon', 'iconpath', 'icon1', 'icon2', 'icon3', 'image',
] as const;
export const RELATIONSHIP_APPEARANCE_FIELDS = [
    'strokecolor', 'strokewidth', 'textcolor', 'textscale', 'arrowscale', 'dash',
    'fromArrow', 'toArrow', 'fromArrowColor', 'toArrowColor',
] as const;
type View = Record<string, any>;
const present = (value: any) => value !== undefined && value !== null &&
    !(typeof value === 'number' && !Number.isFinite(value));
export function appearanceFields(view: View): readonly string[] {
    return Object.prototype.hasOwnProperty.call(view || {}, 'relship') ? RELATIONSHIP_APPEARANCE_FIELDS : OBJECT_APPEARANCE_FIELDS;
}
export function isAppearanceField(view: View, field: string): boolean {
    return appearanceFields(view).includes(field);
}
function typeDefault(view: View, field: string) {
    const typeview = view.typeview || view.object?.type?.typeview || view.relship?.type?.typeview;
    if (present(typeview?.data?.[field])) return typeview.data[field];
    if (present(typeview?.[field])) return typeview[field];
    return view.__appearanceDefaults?.[field];
}
export function resolveAppearance(view: View): View {
    const result: View = {};
    for (const field of appearanceFields(view)) {
        const overrides = view.appearanceOverrides;
        result[field] = overrides && Object.prototype.hasOwnProperty.call(overrides, field)
            ? overrides[field] : typeDefault(view, field);
    }
    return result;
}
/** Keep legacy call sites reading effective values without copying shared defaults. */
export function initializeAppearance(view: View, source?: View) {
    const fields = appearanceFields(view);
    if (!view.__appearanceDefaults) {
        const defaults = Object.fromEntries(fields.map(field => [field, view[field]]));
        Object.defineProperty(view, '__appearanceDefaults', { value: defaults, configurable: true });
    }
    view.appearanceMode = source ? (source.appearanceMode === 'inherit' ? 'inherit' : 'snapshot') : 'inherit';
    const overrides: View = {};
    if (source?.appearanceMode === 'inherit') {
        for (const field of fields) {
            if (Object.prototype.hasOwnProperty.call(source.appearanceOverrides || {}, field) && present(source.appearanceOverrides[field]))
                overrides[field] = source.appearanceOverrides[field];
        }
    } else if (source) {
        // Legacy empty strings meant inheritance. Freeze the effective legacy appearance.
        for (const field of fields) {
            overrides[field] = present(source[field]) && (source.appearanceMode === 'snapshot' || source[field] !== '') ? source[field] : typeDefault(view, field);
            if (!present(overrides[field])) delete overrides[field];
        }
    }
    view.appearanceOverrides = overrides;
    for (const field of fields) {
        Object.defineProperty(view, field, {
            configurable: true, enumerable: true,
            get() {
                return Object.prototype.hasOwnProperty.call(this.appearanceOverrides, field)
                    ? this.appearanceOverrides[field] : typeDefault(this, field);
            },
            set(value) {
                if (!present(value)) return;
                if (Object.is(value, this[field])) return;
                if (this.appearanceMode === 'inherit' && Object.is(value, typeDefault(this, field)))
                    delete this.appearanceOverrides[field];
                else this.appearanceOverrides[field] = value;
            },
        });
    }
}
/** Explicit choices remain pinned even when they match today's default. */
export function setAppearanceOverride(view: View, field: string, value: any) {
    if (isAppearanceField(view, field) && present(value)) {
        view.appearanceMode = 'inherit';
        view.appearanceOverrides ||= {};
        view.appearanceOverrides[field] = value;
    }
}
export function resetAppearance(view: View) {
    view.appearanceMode = 'inherit';
    view.appearanceOverrides = {};
}
export function serializeAppearance(target: View, view: View) {
    if (!view?.appearanceMode) return;
    for (const field of appearanceFields(view)) delete target[field];
    if (view.appearanceMode === 'inherit') {
        target.appearanceMode = 'inherit';
        target.appearanceOverrides = { ...view.appearanceOverrides };
    } else {
        target.appearanceMode = 'snapshot';
        Object.assign(target, resolveAppearance(view));
    }
}
