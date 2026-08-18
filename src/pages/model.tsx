import React, { useState, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import useSessionStorage from '../hooks/use-session-storage';
import useLocalStorage from '../hooks/use-local-storage';
import Modelling from '../components/Modelling';
import Page from '../components/page';
import { selectPersistedAppState } from '../components/utils/persistedState';

const debug = false;

const page = (props: any) => {
    const dispatch = useDispatch();
    const { query } = useRouter();
    const [visibleFocusDetails, setVisibleFocusDetails] = useState(false) // show/hide the focus details (right side)
    const [exportTab, setExportTab] = useState(0);
    

    // Retrieve memorySessionState using the useSessionStorage hook
    const [memoryLocState, setMemoryLocState] = useLocalStorage('memorystate', []);
    // console.log('20 MemoryLocState:', memoryLocState); // Debug log
    const [data, setData] = useState(() => selectPersistedAppState(null, memoryLocState) || {});

    useEffect(() => {
        const parsedMemoryLocState = selectPersistedAppState(null, memoryLocState);

        if (parsedMemoryLocState) {
            const newData = {
                phData: parsedMemoryLocState.phData || {},
                phFocus: parsedMemoryLocState.phFocus || {},
                phUser: parsedMemoryLocState.phUser || {},
                phSource: parsedMemoryLocState.phSource || '',
            };

            console.log('Constructed newData:', newData); // Debug log
            setData(newData);
        } else {
            console.log('memoryLocState is null, undefined, or invalid'); // Debug log
        }
    }, [memoryLocState]);

    // console.log('47 Data passed to Modelling:', data, props);
    return (
        <div className="workarea p-1 w-100" style={{ backgroundColor: "#bcc" }}>
            <Modelling {...data}
                visibleFocusDetails={false}
                setVisibleFocusDetails={false}
                exportTab={false}
                visiblePalette={false}
            />
            {/* <Modelling toggleRefresh={toggleRefresh} /> */}
        </div>
    )
};

export default Page(connect(state => state)(page));
