/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct, MoveTuple, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as vec_set from './deps/sui/vec_set.js';
const $moduleName = '@your-scope/your-package::dataset';
export const Envelope = new MoveStruct({ name: `${$moduleName}::Envelope`, fields: {
        encrypted_key: bcs.vector(bcs.u8()),
        version: bcs.u64()
    } });
export const Dataset = new MoveStruct({ name: `${$moduleName}::Dataset`, fields: {
        id: bcs.Address,
        owner_id: bcs.Address,
        name: bcs.string(),
        description: bcs.string(),
        image_url: bcs.string(),
        project: bcs.string(),
        project_url: bcs.string(),
        incr_index: bcs.u64(),
        derivation_id: bcs.Address,
        envelope: Envelope,
        blob_ids: vec_set.VecSet(bcs.string()),
        price_sui: bcs.u64(),
        funds_receiver: bcs.Address
    } });
export const Reader = new MoveTuple({ name: `${$moduleName}::Reader`, fields: [bcs.Address] });
export interface NewDerivedArguments {
    parent: RawTransactionArgument<string>;
    account: RawTransactionArgument<string>;
    name: RawTransactionArgument<string>;
    description: RawTransactionArgument<string>;
    imageUrl: RawTransactionArgument<string>;
    project: RawTransactionArgument<string>;
    projectUrl: RawTransactionArgument<string>;
    envelope: RawTransactionArgument<number[]>;
    blobIds: RawTransactionArgument<string>;
    priceSui: RawTransactionArgument<number | bigint>;
    fundsReceiver: RawTransactionArgument<string>;
}
export interface NewDerivedOptions {
    package?: string;
    arguments: NewDerivedArguments | [
        parent: RawTransactionArgument<string>,
        account: RawTransactionArgument<string>,
        name: RawTransactionArgument<string>,
        description: RawTransactionArgument<string>,
        imageUrl: RawTransactionArgument<string>,
        project: RawTransactionArgument<string>,
        projectUrl: RawTransactionArgument<string>,
        envelope: RawTransactionArgument<number[]>,
        blobIds: RawTransactionArgument<string>,
        priceSui: RawTransactionArgument<number | bigint>,
        fundsReceiver: RawTransactionArgument<string>
    ];
}
export function newDerived(options: NewDerivedOptions) {
    const packageAddress = options.package ?? '@your-scope/your-package';
    const argumentsTypes = [
        null,
        null,
        '0x1::string::String',
        '0x1::string::String',
        '0x1::string::String',
        '0x1::string::String',
        '0x1::string::String',
        'vector<u8>',
        null,
        'u64',
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["parent", "account", "name", "description", "imageUrl", "project", "projectUrl", "envelope", "blobIds", "priceSui", "fundsReceiver"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'dataset',
        function: 'new_derived',
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
        module: 'dataset',
        function: 'share',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PaySuiToReadArguments {
    self: RawTransactionArgument<string>;
    payment: RawTransactionArgument<string>;
    account: RawTransactionArgument<string>;
}
export interface PaySuiToReadOptions {
    package?: string;
    arguments: PaySuiToReadArguments | [
        self: RawTransactionArgument<string>,
        payment: RawTransactionArgument<string>,
        account: RawTransactionArgument<string>
    ];
}
export function paySuiToRead(options: PaySuiToReadOptions) {
    const packageAddress = options.package ?? '@your-scope/your-package';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["self", "payment", "account"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'dataset',
        function: 'pay_sui_to_read',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IsReaderArguments {
    self: RawTransactionArgument<string>;
    reader: RawTransactionArgument<string>;
}
export interface IsReaderOptions {
    package?: string;
    arguments: IsReaderArguments | [
        self: RawTransactionArgument<string>,
        reader: RawTransactionArgument<string>
    ];
}
export function isReader(options: IsReaderOptions) {
    const packageAddress = options.package ?? '@your-scope/your-package';
    const argumentsTypes = [
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["self", "reader"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'dataset',
        function: 'is_reader',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface EnvelopeVersionArguments {
    self: RawTransactionArgument<string>;
}
export interface EnvelopeVersionOptions {
    package?: string;
    arguments: EnvelopeVersionArguments | [
        self: RawTransactionArgument<string>
    ];
}
export function envelopeVersion(options: EnvelopeVersionOptions) {
    const packageAddress = options.package ?? '@your-scope/your-package';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'dataset',
        function: 'envelope_version',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}