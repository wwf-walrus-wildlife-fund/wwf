/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/** Module: tuskbazaar */

import { MoveTuple, MoveStruct } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
const $moduleName = '@your-scope/your-package::tusk_bazaar';
export const TUSK_BAZAAR = new MoveTuple({ name: `${$moduleName}::TUSK_BAZAAR`, fields: [bcs.bool()] });
export const TuskBazaarNamespace = new MoveStruct({ name: `${$moduleName}::TuskBazaarNamespace`, fields: {
        id: bcs.Address,
        dataset_counter: bcs.u64()
    } });