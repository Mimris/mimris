import { getEditorHost } from './access';

/** Patch an existing host-owned draft without selecting a storage backend. */
export const persistObjectViewDraft = (editor: object | null | undefined, patch: any): void => {
    if (!patch?.id) return;
    const persistence = getEditorHost(editor)?.persistence;
    if (!persistence) return;
    try {
        const draft = persistence.readDraft();
        if (!draft?.phData?.metis) return;
        const modelviewId = patch.modelviewId || patch.modelviewRef;
        const data = JSON.parse(JSON.stringify(patch));
        delete data.modelviewId;
        delete data.modelviewRef;
        const models = (draft.phData.metis as { models?: Array<{
            modelviews?: Array<{ id?: string; objectviews?: Array<Record<string, unknown>> }>;
        }> }).models || [];
        for (const model of models) {
            for (const view of model?.modelviews || []) {
                if (modelviewId && view?.id !== modelviewId) continue;
                const objectviews = view?.objectviews;
                if (!Array.isArray(objectviews)) continue;
                const index = objectviews.findIndex(item => item?.id === patch.id);
                if (index < 0) continue;
                objectviews[index] = { ...objectviews[index], ...data };
                persistence.saveDraft(draft);
                return;
            }
        }
    } catch (_) {
        // Draft persistence is best effort; dispatched model state remains authoritative.
    }
};
