import type { Dispatch, SetStateAction } from 'react';
import LoadFile from '../components/loadModelData/LoadFile';
import LoadJsonFile from '../components/loadModelData/LoadJsonFile';

export interface StandaloneFileControlProps {
    ph: any;
    refresh: boolean;
    setRefresh: Dispatch<SetStateAction<boolean>>;
}
export const StandaloneFileControls = ({ ph, refresh, setRefresh }: StandaloneFileControlProps) => {
    if (typeof window === 'undefined') return null;
    return <>
        <span className="btn bg-success me-1 d-flex justify-content-center align-items-center"
            data-bs-toggle="tooltip" data-bs-placement="top" title="Load downloaded Schema from OSDU (Jsonfiles)">
            <LoadJsonFile buttonLabel="OSDU Import" className="ContextModal" ph={ph} refresh={refresh} setRefresh={setRefresh} />
        </span>
        <span data-bs-toggle="tooltip" data-bs-placement="top" title="Save and Load models (import/export) from/to files"
            style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>
            <LoadFile buttonLabel="" className="ContextModal" ph={ph} refresh={refresh} setRefresh={setRefresh} />
        </span>
    </>;
};
