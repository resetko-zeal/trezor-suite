import React from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { darken } from 'polished';
import { Button, CollapsibleBox, Icon, variables } from '@trezor/components';
import { HELP_CENTER_COINJOIN_URL } from '@trezor/urls';
import { Translation, TrezorLink } from '@suite-components';
import { useSelector } from '@suite-hooks/useSelector';
import { toggleCoinjoinExplanation } from '@suite-actions/suiteActions';
import { ProcessStep, ProcessStepProps } from './ProcessStep';

const Container = styled(CollapsibleBox)`
    border-radius: 14px;
    background: ${({ theme }) => theme.STROKE_GREY};
`;

const QuestionIcon = styled(Icon)`
    margin-right: 4px;
`;

const Steps = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    justify-content: space-between;
    margin-bottom: 20px;
    padding: 20px;
    background: ${({ theme }) => theme.BG_WHITE};
    border-radius: 12px;
`;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: center;
`;

const StyledButton = styled(Button)`
    margin-right: 12px;
    background: #d9d9d9;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};

    path {
        fill: ${({ theme }) => theme.TYPE_DARK_GREY};
    }

    :hover,
    :focus {
        background: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, '#d9d9d9')};
    }

    ${variables.MEDIA_QUERY.DARK_THEME} {
        background: ${({ theme }) => theme.BG_WHITE};

        :hover,
        :focus {
            background: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, theme.BG_WHITE)};
        }
    }
`;

const STEPS: Array<Omit<ProcessStepProps, 'number'>> = [
    {
        image: 'COINS',
        title: <Translation id="TR_COINJOIN_STEP_1_TITLE" />,
        description: <Translation id="TR_COINJOIN_STEP_1_DESCRIPTION" />,
    },
    {
        image: 'BACKUP',
        title: <Translation id="TR_START_COINJOIN" />,
        description: <Translation id="TR_COINJOIN_STEP_2_DESCRIPTION" />,
    },
    {
        image: 'CLOUDY',
        title: <Translation id="TR_COINJOIN_STEP_3_TITLE" />,
        description: <Translation id="TR_COINJOIN_STEP_3_DESCRIPTION" />,
    },
];

export const CoinjoinExplanation = () => {
    const isCoinjoinExplanationHidden = useSelector(
        state => state.suite.settings.isCoinjoinExplanationHidden,
    );

    const dispatch = useDispatch();

    return (
        <Container
            heading={
                <>
                    <QuestionIcon icon="QUESTION" size={15} />
                    <Translation id="TR_COINJOIN_EXPLANATION_TITLE" />
                </>
            }
            opened={!isCoinjoinExplanationHidden}
            onCollapse={() => dispatch(toggleCoinjoinExplanation())}
            variant="small"
        >
            <Steps>
                {STEPS.map((step, index) => (
                    <ProcessStep number={index + 1} key={step.image} {...step} />
                ))}
            </Steps>

            <ButtonContainer>
                <TrezorLink href={HELP_CENTER_COINJOIN_URL} variant="nostyle">
                    <StyledButton icon="EXTERNAL_LINK">
                        <Translation id="TR_LEARN_MORE" />
                    </StyledButton>
                </TrezorLink>

                <Button onClick={() => dispatch(toggleCoinjoinExplanation())}>
                    <Translation id="TR_GOT_IT" />
                </Button>
            </ButtonContainer>
        </Container>
    );
};
