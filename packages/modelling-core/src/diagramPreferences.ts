import { createAction, createReducer, type AnyAction } from '@reduxjs/toolkit';

export interface DiagramPreferences extends Record<string, unknown> {
    showDeleted?: boolean;
    showModified?: boolean;
}
export const setDiagramShowDeleted = createAction<boolean>('diagramPreferences/setShowDeleted');
export const setDiagramShowModified = createAction<boolean>('diagramPreferences/setShowModified');
export const isDiagramPreferenceAction = (action: AnyAction): boolean =>
    setDiagramShowDeleted.match(action) || setDiagramShowModified.match(action)
    || action.type === 'SET_USER_SHOWDELETED' || action.type === 'SET_USER_SHOWMODIFIED';

/** Only the serializable preference leaf enters Immer; runtime/model graphs stay outside it. */
export const diagramPreferencesReducer = createReducer<DiagramPreferences>({}, builder => {
    builder.addCase(setDiagramShowDeleted, (state, action) => { state.showDeleted = action.payload; });
    builder.addCase(setDiagramShowModified, (state, action) => { state.showModified = action.payload; });
    builder.addCase('SET_USER_SHOWDELETED', (state, action) => { state.showDeleted = (action as AnyAction).data; });
    builder.addCase('SET_USER_SHOWMODIFIED', (state, action) => { state.showModified = (action as AnyAction).data; });
});
