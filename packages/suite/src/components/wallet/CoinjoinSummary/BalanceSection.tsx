import React from 'react';
import styled from 'styled-components';

import { Card } from '@suite-components';
import { useSelector } from '@suite-hooks';
import {
    selectCoinjoinAccountByKey,
    selectCurrentCoinjoinBalanceBreakdown,
} from '@wallet-reducers/coinjoinReducer';
import { BalancePrivacyBreakdown } from './BalancePrivacyBreakdown';
import { AnonymizedIndicator } from './AnonymizedIndicator';
import { AnonymizeButton } from './AnonymizeButton';
import { CoinjoinStatus } from './CoinjoinStatus';

export const Container = styled(Card)`
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    height: 150px;
    align-items: center;
`;

interface BalanceSectionProps {
    accountKey: string;
}

export const BalanceSection = ({ accountKey }: BalanceSectionProps) => {
    const coinjoinAccount = useSelector(state => selectCoinjoinAccountByKey(state, accountKey));
    const { notAnonymized } = useSelector(selectCurrentCoinjoinBalanceBreakdown);

    const allAnonymized = notAnonymized === '0';

    const getRightSideComponent = () => {
        if (coinjoinAccount?.session) {
            return <CoinjoinStatus session={coinjoinAccount.session} accountKey={accountKey} />;
        }

        if (allAnonymized) {
            return <AnonymizedIndicator />;
        }

        return <AnonymizeButton accountKey={accountKey} />;
    };

    return (
        <Container>
            <BalancePrivacyBreakdown />
            {getRightSideComponent()}
        </Container>
    );
};
