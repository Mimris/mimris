import { SaveAkmmUser } from '../components/utils/SaveAkmmUser';
import type { LegacyUniverseRoot } from '../sharedUniverse/universeSlice';

const enabled = () => typeof window !== 'undefined'
    && new URLSearchParams(window.location?.search || '').get('workspaceAuthority') !== 'redux';

/** Keep standalone user-setting policy and delayed browser writes outside the reusable editor. */
export const scheduleStandaloneUserSettingsSave = (snapshot: LegacyUniverseRoot): (() => void) => {
    if (!enabled()) return () => {};
    let canceled = false;
    const timer = setTimeout(() => {
        if (!canceled && enabled()) SaveAkmmUser(snapshot, 'akmmUser');
    }, 250);
    return () => { canceled = true; clearTimeout(timer); };
};
