/// Module: tuskbazaar
module tusk_bazaar::tusk_bazaar;

use std::string::String;
use sui::{package::{Self, Publisher}, vec_set};
use tusk_bazaar::dataset::{Self, Dataset};

const EInvalidPublisher: u64 = 0;

public struct TUSK_BAZAAR() has drop;

public struct TuskBazaarNamespace has key {
    id: UID,
    global_counter: u64
}

// derived by Namespace + address
public struct AccountCap has key {
    id: UID,
    datasets_ids: vector<ID>,
}

// @mysten/codegen

public fun new_dataset(account_cap, global_app_data) {
    package-id + counter -> dataset_id,



    account_cap -> edited holds all dataset ids owned by the admin
}

fun init(otw: TUSK_BAZAAR, ctx: &mut TxContext) {
    package::claim_and_keep(otw, ctx);
    transfer::share_object(TuskBazaarNamespace { id: object::new(ctx) });
}



New dataset

package-id + address + address_counter(0 in the first) -> tuskbazaar_account_cap

when someone tries to create a new one without using account_cap (but they have it)
abort

package-id + address + address_counter_from_account_cap -> add dataset_id to the old
tuskbazaar_account_cap


public fun new_dataset(
    self: &mut TuskBazaarNamespace,
    publ: &mut AccountCap,
    admins: vector<address>,
    name: String,
    description: String,
    image_url: String,
    project: String,
    project_url: String,
    envelope: vector<u8>,
    blob_ids: vector<String>,
): Dataset {
    assert!(publ.from_package<TUSK_BAZAAR>(), EInvalidPublisher);
    dataset::new_derived(
        &mut self.id,
        namespace.global_counter,
        vec_set::from_keys(admins),
        name,
        description,
        image_url, ///https://aggreator-url/blob-id
        project,
        project_url,
        envelope,
        vec_set::from_keys(blob_ids),
    )
}
