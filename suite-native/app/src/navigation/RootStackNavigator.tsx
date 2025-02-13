import React from 'react';
import { useSelector } from 'react-redux';

import { createStackNavigator } from '@react-navigation/stack';

import { AccountSettingsScreen } from '@suite-native/module-accounts';
import { AccountsImportStackNavigator } from '@suite-native/module-accounts-import';
import {
    RootStackParamList,
    RootStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import { selectIsOnboardingFinished } from '@suite-native/module-settings';
import { DevUtilsStackNavigator } from '@suite-native/module-dev-utils';
import { TransactionDetailScreen } from '@suite-native/transactions';
import { ReceiveModalScreen } from '@suite-native/module-send-receive';

import { AppTabNavigator } from './AppTabNavigator';

const RootStack = createStackNavigator<RootStackParamList>();

export const RootStackNavigator = () => {
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);

    return (
        <RootStack.Navigator
            initialRouteName={
                isOnboardingFinished ? RootStackRoutes.AppTabs : RootStackRoutes.AccountsImport
            }
            screenOptions={stackNavigationOptionsConfig}
        >
            <RootStack.Screen name={RootStackRoutes.AppTabs} component={AppTabNavigator} />
            <RootStack.Screen
                name={RootStackRoutes.AccountsImport}
                component={AccountsImportStackNavigator}
            />
            <RootStack.Screen
                options={{ title: RootStackRoutes.AccountSettings }}
                name={RootStackRoutes.AccountSettings}
                component={AccountSettingsScreen}
            />
            <RootStack.Screen
                options={{ title: RootStackRoutes.TransactionDetail }}
                name={RootStackRoutes.TransactionDetail}
                component={TransactionDetailScreen}
            />
            <RootStack.Screen
                name={RootStackRoutes.DevUtilsStack}
                component={DevUtilsStackNavigator}
            />
            <RootStack.Group screenOptions={{ presentation: 'modal' }}>
                <RootStack.Screen
                    name={RootStackRoutes.ReceiveModal}
                    component={ReceiveModalScreen}
                />
            </RootStack.Group>
        </RootStack.Navigator>
    );
};
