import { applyMiddleware, createStore, Store } from 'redux';
import createSagaMiddleware, { Task } from 'redux-saga';
import { Context, createWrapper } from 'next-redux-wrapper';
import reducer from './reducers/reducer';
import rootSaga from './saga';

export interface SagaStore extends Store {
    sagaTask: Task;
}

let currentStore: SagaStore | null = null;

export const getCurrentStore = (): SagaStore | null => currentStore;

export const makeStore = (context: Context) => {
    const sagaMiddleware = createSagaMiddleware();

    const bindMiddleware = (middleware: any) => {
        if (process.env.NODE_ENV !== 'production') {
            const { composeWithDevTools } = require('@redux-devtools/extension');
            return composeWithDevTools(applyMiddleware(...middleware));
        }
        return applyMiddleware(...middleware);
    };

    const store = createStore(reducer, bindMiddleware([sagaMiddleware]));
    currentStore = store as SagaStore;

    (store as SagaStore).sagaTask = sagaMiddleware.run(rootSaga);

    return store;
};

export const wrapper = createWrapper<SagaStore>(makeStore as any);
