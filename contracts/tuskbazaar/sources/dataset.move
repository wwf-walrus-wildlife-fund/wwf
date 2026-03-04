module tusk_bazaar::dataset;

use std::string::String;
use sui::derived_object;
use sui::dynamic_field as df;
use sui::vec_set::VecSet;

use fun df::add as UID.df_add;
use fun df::remove as UID.df_remove;
use fun df::exists_ as UID.df_exists;

const ENotAdmin: u64 = 0;
const EInvalidAdminProof: u64 = 1;

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
    envelope: Envelope,
    blob_ids: VecSet<String>, // u256 really, but easier to parse from explorers etc.
}

public struct Envelope has store {
    encrypted_key: vector<u8>,
    version: u64,
}

public struct AdminProof(ID) has drop;

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
    blob_ids: VecSet<String>,
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
        envelope: Envelope { encrypted_key: envelope, version: 0 },
        blob_ids,
    }
}

public(package) fun uid_mut(self: &mut Dataset): &mut UID {
    &mut self.id
}

public fun share(self: Dataset) {
    transfer::share_object(self)
}

// TODO: In the functions below there could be more assertions about df existense.

public fun authorize_address(self: &Dataset, ctx: &TxContext): AdminProof {
    assert!(self.admins.contains(&ctx.sender()), ENotAdmin);
    AdminProof(object::id(self))
}

public fun authorize_object(self: &Dataset, actor: &UID): AdminProof {
    assert!(self.admins.contains(&actor.to_address()), ENotAdmin);
    AdminProof(object::id(self))
}

public fun admin_add_admin(self: &mut Dataset, admin_proof: &AdminProof, new_admin: address) {
    assert!(admin_proof.is_authorized(self), EInvalidAdminProof);
    self.admins.insert(new_admin);
}

public fun admin_revoke_admin(self: &mut Dataset, admin_proof: &AdminProof, old_admin: address) {
    assert!(admin_proof.is_authorized(self), EInvalidAdminProof);
    self.admins.remove(&old_admin);
}

public fun admin_allow_reader(self: &mut Dataset, admin_proof: &AdminProof, reader: address) {
    assert!(admin_proof.is_authorized(self), EInvalidAdminProof);
    self.id.df_add(Reader(reader), false);
}

public fun admin_revoke_reader(self: &mut Dataset, admin_proof: &AdminProof, reader: address) {
    assert!(admin_proof.is_authorized(self), EInvalidAdminProof);
    let _: bool = self.id.df_remove(Reader(reader));
}

public fun is_authorized(admin_proof: &AdminProof, dataset: &Dataset): bool {
    admin_proof.0 == object::id(dataset)
}

public fun is_reader(self: &Dataset, reader: address): bool {
    self.id.df_exists(Reader(reader))
}

public fun dataset_id(self: &AdminProof): ID {
    self.0
}

public fun envelope_version(self: &Dataset): u64 {
    self.envelope.version
}

// TODO key rotation

