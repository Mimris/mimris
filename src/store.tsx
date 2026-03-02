import { configureStore } from '@reduxjs/toolkit';
import { Store } from 'redux';
import createSagaMiddleware, { Task } from 'redux-saga';
import { Context, createWrapper } from 'next-redux-wrapper';
import reducer from './reducers/reducer';
import rootSaga from './saga';

export interface SagaStore extends Store {
    sagaTask: Task;
}

export const makeStore = (context: Context) => {
    const sagaMiddleware = createSagaMiddleware();

    const store = configureStore({
        reducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: false,
                serializableCheck: false,
                immutableCheck: false,
            }).concat(sagaMiddleware),
        devTools: process.env.NODE_ENV !== 'production',
    });

    (store as SagaStore).sagaTask = sagaMiddleware.run(rootSaga);

    return store;
};

export const wrapper = createWrapper<SagaStore>(makeStore as any);
