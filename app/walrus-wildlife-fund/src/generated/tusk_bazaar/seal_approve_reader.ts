/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { type Transaction } from '@mysten/sui/transactions';
import { normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
export interface SealApproveReaderArguments {
    id: RawTransactionArgument<number[]>;
    dataset: RawTransactionArgument<string>;
}
export interface SealApproveReaderOptions {
    package?: string;
    arguments: SealApproveReaderArguments | [
        id: RawTransactionArgument<number[]>,
        dataset: RawTransactionArgument<string>
    ];
}
export function sealApproveReader(options: SealApproveReaderOptions) {
    const packageAddress = options.package ?? '@your-scope/your-package';
    const argumentsTypes = [
        'vector<u8>',
        null
    ] satisfies (string | null)[];
    const parameterNames = ["id", "dataset"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'seal_approve_reader',
        function: 'seal_approve_reader',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}