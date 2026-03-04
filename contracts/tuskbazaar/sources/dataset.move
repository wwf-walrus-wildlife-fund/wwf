module tusk_bazaar::dataset;

use std::string::String;
use sui::derived_object;
use sui::dynamic_field as df;
use sui::vec_set::VecSet;

use fun df::add as UID.df_add;
use fun df::remove as UID.df_remove;

const ENotAdmin: u64 = 0;

public struct Dataset has key {
    id: UID,
    // TODO: convert to vecset?
    admins: VecSet<address>,
    name: String,
    description: String,
    image_url: String,
    project: String,
    project_url: String,
    derivation_key: String,
    derivation_id: ID,
    envelope: vector<u8>,
}

public struct Reader(address) has copy, drop, store;

public(package) fun new_derived(
    parent: &mut UID,
    der_key: String,
    admins: VecSet<address>,
    name: String,
    description: String,
    image_url: String,
    project: String,
    project_url: String,
    envelope: vector<u8>,
): Dataset {
    let derivation_id = parent.to_inner();
    let id = derived_object::claim(parent, der_key);
    Dataset {
        id,
        admins,
        name,
        description,
        image_url,
        project,
        project_url,
        derivation_key: der_key,
        derivation_id,
        envelope,
    }
}

public fun share(self: Dataset) {
    transfer::share_object(self)
}

// TODO: In the functions below there could be more assertions about df existense.

public fun admin_add_admin(self: &mut Dataset, new_admin: address, ctx: &TxContext) {
    assert!(self.admins.contains(&ctx.sender()), ENotAdmin);
    self.admins.insert(new_admin);
}

public fun admin_revoke_admin(self: &mut Dataset, old_admin: address, ctx: &TxContext) {
    assert!(self.admins.contains(&ctx.sender()), ENotAdmin);
    self.admins.remove(&old_admin);
}

public fun admin_allow_reader(self: &mut Dataset, reader: address, ctx: &TxContext) {
    assert!(self.admins.contains(&ctx.sender()), ENotAdmin);
    self.id.df_add(Reader(reader), false);
}

public fun object_admin_allow_reader(self: &mut Dataset, admin: &UID, reader: address) {
    assert!(self.admins.contains(&admin.to_address()), ENotAdmin);
    self.id.df_add(Reader(reader), false);
}

public fun admin_revoke_reader(self: &mut Dataset, reader: address, ctx: &TxContext) {
    assert!(self.admins.contains(&ctx.sender()), ENotAdmin);
    let _: bool = self.id.df_remove(Reader(reader));
}

public fun object_admin_revoke_reader(self: &mut Dataset, admin: &UID, reader: address) {
    assert!(self.admins.contains(&admin.to_address()), ENotAdmin);
    let _: bool = self.id.df_remove(Reader(reader));
}
