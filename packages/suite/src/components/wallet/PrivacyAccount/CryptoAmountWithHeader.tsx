import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { FiatValue } from '@suite-components/FiatValue';
import { FormattedCryptoAmount } from '@suite-components/FormattedCryptoAmount';
import { NetworkSymbol } from '@wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    line-height: 1;

    > :first-child {
        margin-right: 6px;
        padding-bottom: 2px;
    }
`;

const CryptoAmount = styled(FormattedCryptoAmount)<{ color?: string }>`
    margin: 6px 0 4px;
    color: ${({ theme, color }) => color || theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.H3};
`;

interface CryptoAmountWithHeaderProps {
    header: React.ReactNode;
    headerIcon?: React.ReactNode;
    value: string;
    symbol: NetworkSymbol;
    color?: string;
}

export const CryptoAmountWithHeader = ({
    header,
    headerIcon,
    value,
    symbol,
    color,
}: CryptoAmountWithHeaderProps) => (
    <Container>
        <Header>
            {headerIcon && headerIcon} {header}
        </Header>

        <CryptoAmount value={formatNetworkAmount(value, symbol)} symbol={symbol} color={color} />
        <FiatValue amount={value} symbol={symbol} showApproximationIndicator />
    </Container>
);
