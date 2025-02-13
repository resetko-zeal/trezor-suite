import React from 'react';
import { useSelector } from 'react-redux';

import { Box, Card, Divider, Text, VStack } from '@suite-native/atoms';
import { AccountKey, WalletAccountTransaction } from '@suite-common/wallet-types';
import { Icon } from '@trezor/icons';
import { isPending } from '@suite-common/wallet-utils';
import { useFormatters } from '@suite-common/formatters';
import { CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { selectTransactionBlockTimeById, TransactionsRootState } from '@suite-common/wallet-core';

import { TransactionDetailSummary } from './TransactionDetailSummary';
import { TransactionDetailRow } from './TransactionDetailRow';

type TransactionDetailDataProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
};

export const TransactionDetailData = ({ transaction, accountKey }: TransactionDetailDataProps) => {
    const { CryptoAmountFormatter, DateTimeFormatter } = useFormatters();
    const transactionBlockTime = useSelector((state: TransactionsRootState) =>
        selectTransactionBlockTimeById(state, transaction.txid, accountKey),
    );

    // Only one input and output address for now until UX comes up with design to support multiple outputs
    const transactionOriginAddresses = transaction.details.vin[0].addresses;
    const transactionTargetAddresses = transaction.targets[0].addresses;

    const isTransactionPending = isPending(transaction);

    return (
        <>
            <VStack>
                <Card>
                    <TransactionDetailRow title="Date">
                        <Text variant="hint" color="gray1000">
                            <DateTimeFormatter value={transactionBlockTime} />
                        </Text>
                        <Box marginLeft="small">
                            <Icon name="calendar" size="medium" color="gray1000" />
                        </Box>
                    </TransactionDetailRow>
                </Card>
                <TransactionDetailSummary
                    origin={transactionOriginAddresses && transactionOriginAddresses[0]}
                    target={transactionTargetAddresses && transactionTargetAddresses[0]}
                    transactionStatus={isTransactionPending ? 'pending' : 'confirmed'}
                />
                <Card>
                    <TransactionDetailRow title="Fee">
                        <Box alignItems="flex-end">
                            <Text color="gray1000">
                                <CryptoAmountFormatter
                                    value={transaction.fee}
                                    symbol={transaction.symbol}
                                />
                            </Text>
                            <Text variant="hint" color="gray600">
                                ≈{' '}
                                <CryptoToFiatAmountFormatter
                                    value={transaction.fee}
                                    network={transaction.symbol}
                                    customRates={transaction.rates}
                                />
                            </Text>
                        </Box>
                    </TransactionDetailRow>
                </Card>
            </VStack>
            <Box marginVertical="medium">
                <Divider />
            </Box>
        </>
    );
};
