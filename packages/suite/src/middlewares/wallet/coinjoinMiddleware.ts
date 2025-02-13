import type { MiddlewareAPI } from 'redux';
import { UI, DEVICE } from '@trezor/connect';
import { SUITE, ROUTER, MESSAGE_SYSTEM } from '@suite-actions/constants';
import {
    SESSION_ROUND_CHANGED,
    SET_DEBUG_SETTINGS,
} from '@wallet-actions/constants/coinjoinConstants';
import { DISCOVERY } from '@wallet-actions/constants';
import * as coinjoinAccountActions from '@wallet-actions/coinjoinAccountActions';
import * as storageActions from '@suite-actions/storageActions';
import { CoinjoinService } from '@suite/services/coinjoin';
import type { AppState, Action, Dispatch } from '@suite-types';
import { RoundPhase } from '@wallet-types/coinjoin';
import { blockchainActions, accountsActions } from '@suite-common/wallet-core';
import {
    selectCoinjoinAccountByKey,
    selectIsAccountWithSessionByAccountKey,
    selectIsAnySessionInCriticalPhase,
    selectIsAccountWithPausedSessionInterruptedByAccountKey,
    selectIsAccountWithSessionInCriticalPhaseByAccountKey,
    selectIsCoinjoinBlockedByTor,
} from '@wallet-reducers/coinjoinReducer';
import { selectDeviceState } from '@suite-reducers/suiteReducer';

import { Feature, selectIsFeatureDisabled } from '@suite-reducers/messageSystemReducer';

export const coinjoinMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        // check for conditions that block restoring coinjoin session for all accounts
        const isCoinjoinSessionBlockedGlobally = (state: AppState) => {
            const deviceStatus = selectDeviceState(state);
            const isDeviceDisconnected = deviceStatus !== 'connected';
            const isCoinJoinBlockedByTor = selectIsCoinjoinBlockedByTor(state);
            const isCoinJoinDisabledByFeatureFlag = selectIsFeatureDisabled(
                state,
                Feature.coinjoin,
            );
            const isCoinjoinBlockedByRoute = state.router.route?.name === 'wallet-send';
            return (
                isDeviceDisconnected ||
                isCoinJoinBlockedByTor ||
                isCoinJoinDisabledByFeatureFlag ||
                isCoinjoinBlockedByRoute ||
                !state.suite.online
            );
        };
        // check for blocking conditions for individual accounts and restore session for those eligible
        const restoreInterruptedCoinjoinSessions = (state: AppState) => {
            const eligibleAccounts = state.wallet.accounts.filter(account => {
                const coinjoinAccount = selectCoinjoinAccountByKey(state, account.key);
                return (
                    account.backendType === 'coinjoin' &&
                    account.status !== 'out-of-sync' &&
                    coinjoinAccount?.session?.interrupted &&
                    !coinjoinAccount?.session?.starting
                );
            });
            eligibleAccounts.forEach(account =>
                api.dispatch(coinjoinAccountActions.restoreCoinjoinSession(account.key)),
            );
        };

        // cancel discovery for each CoinjoinBackend
        if (action.type === ROUTER.LOCATION_CHANGE && action.payload.app !== 'wallet') {
            CoinjoinService.getInstances().forEach(({ backend }) => backend.cancel());
        }

        // do not close success and critical phase modals when they are open, similar to discovery middleware
        const { modal } = api.getState();
        const allowedModals = ['coinjoin-success', 'more-rounds-needed', 'critical-coinjoin-phase'];

        if (
            action.type === UI.CLOSE_UI_WINDOW &&
            'payload' in modal &&
            allowedModals.includes(modal.payload?.type)
        ) {
            return action;
        }

        if (accountsActions.updateSelectedAccount.match(action) && action.payload.account) {
            const { account } = action.payload;
            const state = api.getState();
            const selectedAccountPrevStatus =
                state?.wallet?.selectedAccount?.account?.backendType === 'coinjoin' &&
                state?.wallet?.selectedAccount?.account?.status;
            const selectedAccountNextStatus = account.backendType === 'coinjoin' && account.status;

            if (
                selectedAccountPrevStatus === 'ready' &&
                selectedAccountNextStatus === 'out-of-sync'
            ) {
                const isAccountWithSession = selectIsAccountWithSessionByAccountKey(
                    state,
                    account.key,
                );
                const isAccountInCriticalPhase =
                    selectIsAccountWithSessionInCriticalPhaseByAccountKey(state, account.key);
                if (!isAccountInCriticalPhase && isAccountWithSession) {
                    api.dispatch(coinjoinAccountActions.pauseCoinjoinSession(account.key, true));
                }
            } else if (
                selectedAccountNextStatus === 'ready' &&
                !isCoinjoinSessionBlockedGlobally(state)
            ) {
                // When account goes from out-of-sync to ready, session should resume automatically if
                // there is not any other condition blocking coinjoin resume.
                const isAccountWithPausedSessionInterrupted =
                    selectIsAccountWithPausedSessionInterruptedByAccountKey(state, account.key);

                if (isAccountWithPausedSessionInterrupted) {
                    api.dispatch(coinjoinAccountActions.restoreCoinjoinSession(account.key));
                }
            }
        }

        // propagate action to reducers
        next(action);

        if (action.type === SUITE.READY) {
            api.dispatch(coinjoinAccountActions.restoreCoinjoinAccounts());
        }

        if (accountsActions.removeAccount.match(action)) {
            api.dispatch(coinjoinAccountActions.forgetCoinjoinAccounts(action.payload));
        }

        if (action.type === DISCOVERY.START) {
            // find all coinjoin accounts
            const coinjoinAccounts = api
                .getState()
                .wallet.accounts.filter(a => a.accountType === 'coinjoin');
            if (coinjoinAccounts.length > 0) {
                coinjoinAccounts.forEach(a =>
                    api.dispatch(coinjoinAccountActions.fetchAndUpdateAccount(a)),
                );
            }
        }

        if (action.type === DEVICE.DISCONNECT && action.payload.id) {
            api.dispatch(coinjoinAccountActions.pauseCoinjoinSessionByDeviceId(action.payload.id));
        }

        if (blockchainActions.synced.match(action)) {
            // find all coinjoin accounts for network
            const coinjoinAccounts = api
                .getState()
                .wallet.accounts.filter(
                    a => a.accountType === 'coinjoin' && a.symbol === action.payload.symbol,
                );
            if (coinjoinAccounts.length > 0) {
                coinjoinAccounts.forEach(a =>
                    api.dispatch(coinjoinAccountActions.fetchAndUpdateAccount(a)),
                );
            }
        }

        if (action.type === SUITE.TOR_STATUS) {
            if (['Disabling', 'Disabled', 'Error'].includes(action.payload)) {
                api.dispatch(coinjoinAccountActions.pauseInterruptAllCoinjoinSessions());
            }
            // We restore sessions that were interrupted when successfully Enabled if
            // there is not any other condition blocking coinjoin resume.
            const state = api.getState();
            if (action.payload === 'Enabled' && !isCoinjoinSessionBlockedGlobally(state)) {
                restoreInterruptedCoinjoinSessions(state);
            }
        }

        if (
            action.type === MESSAGE_SYSTEM.SAVE_VALID_MESSAGES ||
            action.type === SESSION_ROUND_CHANGED
        ) {
            const state = api.getState();

            const isCoinJoinDisabledByFeatureFlag = selectIsFeatureDisabled(
                state,
                Feature.coinjoin,
            );

            if (isCoinJoinDisabledByFeatureFlag) {
                const isAnySessionInCriticalPhase = selectIsAnySessionInCriticalPhase(state);
                const hasCriticalPhaseJustEnded =
                    action.type === SESSION_ROUND_CHANGED &&
                    action.payload.round.phase === RoundPhase.Ended;

                if (!isAnySessionInCriticalPhase || hasCriticalPhaseJustEnded) {
                    api.dispatch(coinjoinAccountActions.pauseInterruptAllCoinjoinSessions());
                }
            }
        }

        if (action.type === SET_DEBUG_SETTINGS) {
            api.dispatch(storageActions.saveCoinjoinDebugSettings());
        }

        // automatically pause/restore coinjoin session depending on current route
        // device may be locked by another connect call, so check on LOCK_DEVICE action as well
        if (action.type === ROUTER.LOCATION_CHANGE || action.type === SUITE.LOCK_DEVICE) {
            const state = api.getState();
            const { locks } = state.suite;
            if (!locks.includes(SUITE.LOCK_TYPE.DEVICE) && !locks.includes(SUITE.LOCK_TYPE.UI)) {
                if (
                    state.router.settingsBackRoute.name === 'wallet-send' &&
                    !isCoinjoinSessionBlockedGlobally(state)
                ) {
                    // restore all interrupted sessions upon leaving send form
                    restoreInterruptedCoinjoinSessions(state);
                } else {
                    const accountKey = state.wallet.selectedAccount.account?.key;
                    if (accountKey) {
                        const session = selectCoinjoinAccountByKey(state, accountKey)?.session;
                        if (
                            state.router.route?.name === 'wallet-send' &&
                            !session?.paused &&
                            !session?.starting
                        ) {
                            // pause session while in send form
                            api.dispatch(
                                coinjoinAccountActions.pauseCoinjoinSession(accountKey, true),
                            );
                        }
                    }
                }
            }
        }

        return action;
    };
