import React from 'react';
import styled from 'styled-components';
import TrezorLink from '@suite-components/TrezorLink';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import TransactionItem from '@wallet-components/TransactionItem';
import { Network } from '@wallet-types';

const Wrapper = styled.div`
    text-align: left;
    margin-top: 25px;
`;

const StyledTrezorLink = styled(TrezorLink)`
    width: 100%;
`;

const ChainedTransactionItem = styled(TransactionItem)`
    width: 100%;
    padding: 0px 40px;
    cursor: pointer;
    &:hover {
        background: ${props => props.theme.BG_GREY};
    }
`;

interface ChainedTxsProps {
    txs: WalletAccountTransaction[];
    network: Network;
    explorerUrl: string;
}

export const ChainedTxs = ({ txs, network, explorerUrl }: ChainedTxsProps) => (
    <Wrapper>
        {txs.map(tx => (
            <StyledTrezorLink key={tx.txid} href={`${explorerUrl}${tx.txid}`} variant="nostyle">
                <ChainedTransactionItem
                    key={tx.txid}
                    transaction={tx}
                    network={network}
                    isPending
                    isActionDisabled
                    accountKey={`${tx.descriptor}-${tx.symbol}-${tx.deviceState}`}
                />
            </StyledTrezorLink>
        ))}
    </Wrapper>
);
