/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct, MoveTuple, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as vec_set from './deps/sui/vec_set.js';
const $moduleName = '@your-scope/your-package::account';
export const Account = new MoveStruct({ name: `${$moduleName}::Account`, fields: {
        id: bcs.Address,
        owner: bcs.Address,
        own_datasets: vec_set.VecSet(bcs.Address),
        read_datasets: vec_set.VecSet(bcs.Address)
    } });
export const AccountTag = new MoveTuple({ name: `${$moduleName}::AccountTag`, fields: [bcs.Address] });
export interface NewArguments {
    namespace: RawTransactionArgument<string>;
}
export interface NewOptions {
    package?: string;
    arguments: NewArguments | [
        namespace: RawTransactionArgument<string>
    ];
}
export function _new(options: NewOptions) {
    const packageAddress = options.package ?? '@your-scope/your-package';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["namespace"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'account',
        function: 'new',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ShareArguments {
    self: RawTransactionArgument<string>;
}
export interface ShareOptions {
    package?: string;
    arguments: ShareArguments | [
        self: RawTransactionArgument<string>
    ];
}
export function share(options: ShareOptions) {
    const packageAddress = options.package ?? '@your-scope/your-package';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'account',
        function: 'share',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OwnerArguments {
    self: RawTransactionArgument<string>;
}
export interface OwnerOptions {
    package?: string;
    arguments: OwnerArguments | [
        self: RawTransactionArgument<string>
    ];
}
export function owner(options: OwnerOptions) {
    const packageAddress = options.package ?? '@your-scope/your-package';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'account',
        function: 'owner',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}