module tusk_bazaar::account;

use sui::{derived_object, vec_set::{Self, VecSet}};
use tusk_bazaar::tusk_bazaar::TuskBazaarNamespace;

// shared object
// Derived by TuskBazaarNamespace.id + owner_address(sender)
public struct Account has key {
    id: UID,
    owner: address,
    own_datasets: VecSet<ID>,
    read_datasets: VecSet<ID>,
}

public struct AccountTag(address) has copy, drop, store;

public fun new(namespace: &mut TuskBazaarNamespace, ctx: &TxContext): Account {
    let id = derived_object::claim(namespace.uid_mut(), AccountTag(ctx.sender()));

    Account {
        id,
        owner: ctx.sender(),
        own_datasets: vec_set::empty(),
        read_datasets: vec_set::empty(),
    }
}

public fun share(self: Account) {
    transfer::share_object(self);
}

public fun owner(self: &Account): address {
    self.owner
}

public(package) fun add_read_dataset(self: &mut Account, dataset_id: ID) {
    self.read_datasets.insert(dataset_id);
}

public(package) fun add_own_dataset(self: &mut Account, dataset_id: ID) {
    self.own_datasets.insert(dataset_id);
}
