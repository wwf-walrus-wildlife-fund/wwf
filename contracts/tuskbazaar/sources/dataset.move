module tusk_bazaar::dataset;

use std::string::String;
use sui::{coin::Coin, derived_object, dynamic_field as df, sui::SUI, vec_set::{Self, VecSet}};
use tusk_bazaar::{account::Account, tusk_bazaar::TuskBazaarNamespace};

use fun df::add as UID.df_add;
use fun df::exists_ as UID.df_exists;

const EInvalidPayment: u64 = 1;
const ENotYourAccount: u64 = 3;

/// Its UID is derived by TuskBazaarNamespace.id + counter at current moment (incr_index)
public struct Dataset has key {
    id: UID,
    owner_id: ID,
    name: String,
    description: String,
    image_url: String,
    project: String,
    project_url: String,
    incr_index: u64,
    derivation_id: ID,
    envelope: Envelope,
    blob_ids: VecSet<String>, // u256 really, but easier to parse from explorers etc.
    /// JSON manifest: file names, sizes, mimeTypes, storageType (blobs | quilt).
    file_manifest: String,
    price_sui: u64,
    funds_receiver: address,
}

public struct Envelope has store {
    encrypted_key: vector<u8>,
    version: u64,
}

// How it is derived as DF
public struct Reader(address) has copy, drop, store;

public fun new_derived(
    parent: &mut TuskBazaarNamespace,
    account: &mut Account,
    name: String,
    description: String,
    image_url: String,
    project: String,
    project_url: String,
    envelope: vector<u8>,
    blob_ids: vector<String>,
    file_manifest: String,
    price_sui: u64,
    funds_receiver: address,
    ctx: &TxContext,
): Dataset {
    let sender = ctx.sender();
    assert!(account.owner() == sender, ENotYourAccount);
    let derivation_id = object::id(parent);
    let incr_index = parent.get_and_increment_counter();
    let mut id = derived_object::claim(parent.uid_mut(), incr_index);
    // Add Account owner as reader too.
    id.df_add(Reader(sender), false);
    account.add_own_dataset(id.to_inner());
    Dataset {
        id,
        owner_id: object::id(account),
        name,
        description,
        image_url,
        project,
        project_url,
        incr_index,
        derivation_id,
        envelope: Envelope { encrypted_key: envelope, version: 0 },
        blob_ids: vec_set::from_keys(blob_ids),
        file_manifest,
        price_sui,
        funds_receiver,
    }
}

public fun share(self: Dataset) {
    transfer::share_object(self)
}

public fun pay_sui_to_read(
    self: &mut Dataset,
    payment: Coin<SUI>,
    account: &mut Account,
    ctx: &TxContext,
) {
    let sender = ctx.sender();
    assert!(sender == account.owner(), ENotYourAccount);
    assert!(payment.value() == self.price_sui, EInvalidPayment);
    transfer::public_transfer(payment, self.funds_receiver);
    account.add_read_dataset(object::id(self));
    self.id.df_add(Reader(sender), false);
}

public fun is_reader(self: &Dataset, reader: address): bool {
    self.id.df_exists(Reader(reader))
}

public fun envelope_version(self: &Dataset): u64 {
    self.envelope.version
}

// TODO: revoke reader if for example they share the dataset openly
// public fun revoke_reader()
// TODO: change price
