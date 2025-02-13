import { combineReducers, createReducer } from '@reduxjs/toolkit';
import { configureMockStore, testMocks } from '@suite-common/test-utils';

import { accountsReducer } from '@wallet-reducers';
import { coinjoinReducer } from '@wallet-reducers/coinjoinReducer';
import * as coinjoinAccountActions from '../coinjoinAccountActions';
import * as fixtures from '../__fixtures__/coinjoinAccountActions';
import { CoinjoinService } from '@suite/services/coinjoin/coinjoinService';

jest.mock('@trezor/connect', () => global.JestMocks.getTrezorConnect({}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TrezorConnect = require('@trezor/connect').default;

jest.mock('@suite/services/coinjoin/coinjoinService', () => {
    const allowed = ['btc', 'test'];
    const clients: Record<string, any> = {}; // @trezor/coinjoin CoinjoinClient
    const getMockedInstance = (network: string) => {
        const client = {
            settings: { coordinatorName: '', network },
            on: jest.fn(),
            off: jest.fn(),
            enable: jest.fn(() =>
                Promise.resolve({
                    rounds: [{ id: '00', phase: 0 }],
                    maxMiningFee: 0,
                    coordinatorFeeRate: 0.003,
                    allowedInputAmounts: { min: 5000, max: 134375000000 },
                }),
            ),
            registerAccount: jest.fn(),
            unregisterAccount: jest.fn(),
            updateAccount: jest.fn(),
        };
        const backend = {
            on: jest.fn(),
            off: jest.fn(),
            cancel: jest.fn(),
            scanAccount: jest.fn(() => Promise.reject(new Error('TODO: implement me'))),
        };
        return { client, backend };
    };

    return {
        // for test purposes enable only btc network
        CoinjoinService: {
            getInstance: (symbol: string) => clients[symbol],
            getInstances: () => Object.values(clients),
            createInstance: (symbol: string) => {
                if (!allowed.includes(symbol)) throw new Error('Client not supported');
                if (clients[symbol]) return clients[symbol];
                const instance = getMockedInstance(symbol);
                clients[symbol] = instance;
                return instance;
            },
            removeInstance: (symbol: string) => {
                delete clients[symbol];
            },
        },
    };
});

const DEVICE = testMocks.getSuiteDevice({ state: 'device-state', connected: true });

const rootReducer = combineReducers({
    suite: createReducer(
        {
            locks: [],
            device: DEVICE,
            settings: {
                debug: {},
            },
        },
        {},
    ),
    devices: createReducer([DEVICE], {}),
    modal: () => ({}),
    wallet: combineReducers({
        coinjoin: coinjoinReducer,
        accounts: accountsReducer,
    }),
});

type State = ReturnType<typeof rootReducer>;
type Wallet = Partial<State['wallet']> & { devices?: State['devices'] };

const initStore = ({ accounts, coinjoin, devices }: Wallet = {}) => {
    const preloadedState: State = JSON.parse(
        JSON.stringify(rootReducer(undefined, { type: 'init' })),
    );
    if (devices) {
        preloadedState.devices = devices;
    }
    if (accounts) {
        preloadedState.wallet.accounts = accounts;
    }
    if (coinjoin) {
        preloadedState.wallet.coinjoin = {
            ...preloadedState.wallet.coinjoin,
            ...coinjoin,
        };
    }
    // State != suite AppState, therefore <any>
    return configureMockStore<any>({ reducer: rootReducer, preloadedState });
};

describe('coinjoinAccountActions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        CoinjoinService.getInstances().forEach(({ client }) => {
            CoinjoinService.removeInstance(client.settings.network);
        });
    });

    fixtures.createCoinjoinAccount.forEach(f => {
        it(`createCoinjoinAccount: ${f.description}`, async () => {
            const store = initStore();
            TrezorConnect.setTestFixtures(f.connect);

            await store.dispatch(coinjoinAccountActions.createCoinjoinAccount(f.params as any, 80)); // params are incomplete

            const actions = store.getActions();
            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });

    fixtures.startCoinjoinSession.forEach(f => {
        it(`startCoinjoinSession: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);
            TrezorConnect.setTestFixtures(f.connect);
            // @ts-expect-error params are incomplete
            await store.dispatch(coinjoinAccountActions.startCoinjoinSession(f.params, {}));

            const actions = store.getActions();
            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });

    fixtures.stopCoinjoinSession.forEach(f => {
        it(`stopCoinjoinSession: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);

            if (f.client) {
                await CoinjoinService.createInstance(f.client as any);
            }

            await store.dispatch(coinjoinAccountActions.stopCoinjoinSession(f.param));

            const actions = store.getActions();
            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });

    fixtures.restoreCoinjoinAccounts.forEach(f => {
        it(`restoreCoinjoinAccounts: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);

            await store.dispatch(coinjoinAccountActions.restoreCoinjoinAccounts());

            const actions = store.getActions();
            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });

    fixtures.restoreCoinjoinSession.forEach(f => {
        it(`restoreCoinjoinSession: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);

            if (f.client) {
                await CoinjoinService.createInstance(f.client as any);
            }

            await store.dispatch(coinjoinAccountActions.restoreCoinjoinSession(f.param));

            const actions = store.getActions();

            expect(actions.map(a => a.type)).toEqual(f.result.actions);
        });
    });
});
