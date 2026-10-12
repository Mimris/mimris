import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modelling from '../components/Modelling';
import { selectSharedUniverseState, setUniverseFocusField } from '../sharedUniverse';
import { StandaloneFileControls, type StandaloneFileControlProps } from './StandaloneFileControls';
import { createStandaloneEditorPersistence } from './editorPersistence';
import { scheduleStandaloneUserSettingsSave } from './userSettings';
import { persistStandaloneModellingState, rememberStandaloneModel } from './modellingPersistence';

const renderFileControls = (props: StandaloneFileControlProps) => <StandaloneFileControls {...props} />;
const focusKey = 'mimris.modelling.focusModelId';
const StandaloneModellingClient = (props: any) => {
    const dispatch = useDispatch();
    const universe = useSelector(selectSharedUniverseState);
    const models = (universe.world.worldModel.metis as any)?.models;
    const focus = universe.world.focus as any;
    const restored = useRef(false);
    const [userSettings] = useState(() => {
        try { return JSON.parse(window.localStorage.getItem('akmmUser') || '""'); }
        catch (_) { return ''; }
    });
    useEffect(() => {
        if (restored.current) return;
        if (new URLSearchParams(window.location.search).get('currentModelRef')) {
            restored.current = true;
            return;
        }
        if (!models?.length) return;
        restored.current = true;
        const id = window.sessionStorage.getItem(focusKey);
        if (!id || focus?.focusModel?.id === id) return;
        const model = models.find((item: any) => item?.id === id);
        if (!model) return;
        const view = model.modelviews?.find((item: any) => item) || model.modelviews?.[0];
        dispatch(setUniverseFocusField({ field: 'focusModel', value: { id: model.id, name: model.name } }));
        if (view) dispatch(setUniverseFocusField({ field: 'focusModelview', value: { id: view.id, name: view.name } }));
    }, [dispatch, models, focus?.focusModel?.id]);
    useEffect(() => {
        if (focus?.focusModel?.id) window.sessionStorage.setItem(focusKey, focus.focusModel.id);
    }, [focus?.focusModel?.id]);
    return <Modelling {...props} userSettings={userSettings}
        createDraftPersistence={createStandaloneEditorPersistence}
        persistState={persistStandaloneModellingState}
        scheduleUserSettingsSave={scheduleStandaloneUserSettingsSave}
        rememberModelSelection={rememberStandaloneModel}
        renderFileControls={renderFileControls} />;
};
/** Browser storage and remembered-focus policy belong to this standalone composition. */
const StandaloneModelling = (props: any) => typeof window === 'undefined' ? null : <StandaloneModellingClient {...props} />;
export default StandaloneModelling;
