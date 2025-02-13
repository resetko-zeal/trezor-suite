import React from 'react';

import { WalletLayout, WalletLayoutHeader } from '@wallet-components';
import { useDevice, useSelector, useActions } from '@suite-hooks';
import * as receiveActions from '@wallet-actions/receiveActions';

import { selectPendingAccountAddresses } from '@suite-common/wallet-core';
import { selectDevice } from '@suite-reducers/suiteReducer';

import { FreshAddress } from './components/FreshAddress';
import { UsedAddresses } from './components/UsedAddresses';
import { CoinjoinCexWarning } from './components/CoinjoinCexWarning';

const Receive = () => {
    const isCexWarningHidden = useSelector(
        state => state.suite.settings.isCoinjoinCexWarningHidden,
    );
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const receive = useSelector(state => state.wallet.receive);
    const device = useSelector(selectDevice);

    const { showAddress } = useActions({
        showAddress: receiveActions.showAddress,
    });

    const { account } = selectedAccount;

    const pendingAddresses = useSelector(state =>
        selectPendingAccountAddresses(state, account?.key ?? null),
    );

    const { isLocked } = useDevice();

    const isDeviceLocked = isLocked(true);

    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_RECEIVE" account={selectedAccount} />;
    }

    const disabled = !!device.authConfirm;
    const showCexWarning = account?.accountType === 'coinjoin' && !isCexWarningHidden;

    return (
        <WalletLayout title="TR_NAV_RECEIVE" account={selectedAccount}>
            <WalletLayoutHeader title="TR_NAV_RECEIVE" />

            {showCexWarning && <CoinjoinCexWarning />}

            <FreshAddress
                account={account}
                addresses={receive}
                showAddress={showAddress}
                disabled={disabled}
                locked={isDeviceLocked}
                pendingAddresses={pendingAddresses}
            />

            <UsedAddresses
                account={account}
                addresses={receive}
                showAddress={showAddress}
                locked={isDeviceLocked}
                pendingAddresses={pendingAddresses}
            />
        </WalletLayout>
    );
};

export default Receive;
