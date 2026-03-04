/// Module: tuskbazaar
module tusk_bazaar::tusk_bazaar;

use sui::package;

public struct TUSK_BAZAAR() has drop;

// Created at contract publish. Kept as constant.
public struct TuskBazaarNamespace has key {
    id: UID,
    dataset_counter: u64,
}

// @mysten/codegen
public(package) fun uid_mut(self: &mut TuskBazaarNamespace): &mut UID {
    &mut self.id
}

public(package) fun get_and_increment_counter(self: &mut TuskBazaarNamespace): u64 {
    self.dataset_counter = self.dataset_counter + 1;
    self.dataset_counter - 1
}

fun init(otw: TUSK_BAZAAR, ctx: &mut TxContext) {
    package::claim_and_keep(otw, ctx);
    transfer::share_object(TuskBazaarNamespace { id: object::new(ctx), dataset_counter: 0 });
}

