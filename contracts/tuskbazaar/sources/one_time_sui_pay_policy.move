// Using SUI for now for convenience
module tusk_bazaar::one_time_sui_pay_policy;

use std::string::String;
use sui::{balance::{Self, Balance}, coin::Coin, derived_object, sui::SUI};
use tusk_bazaar::dataset::{AdminProof, Dataset};

const EInvalidAdminProof: u64 = 0;
const EInvalidDatasetPolicyCombination: u64 = 1;
const EInvalidPayment: u64 = 2;

public struct SuiPayPolicy has key {
    id: UID,
    derivation_key: String,
    dataset_id: ID,
    price: u64,
    funds: Balance<SUI>,
}

public fun create_policy(parent: &mut Dataset, admin_proof: &AdminProof, price: u64): SuiPayPolicy {
    assert!(admin_proof.is_authorized(parent), EInvalidAdminProof);
    let derivation_key = b"SuiPayPolicy".to_string();
    let id = derived_object::claim(parent.uid_mut(), derivation_key);
    SuiPayPolicy {
        id,
        derivation_key,
        dataset_id: object::id(parent),
        price,
        funds: balance::zero(),
    }
}

public fun share(self: SuiPayPolicy) {
    transfer::share_object(self)
}

public fun pay_to_read(
    self: &mut SuiPayPolicy,
    dataset: &mut Dataset,
    payment: Coin<SUI>,
    ctx: &TxContext,
) {
    assert!(self.dataset_id == object::id(dataset), EInvalidDatasetPolicyCombination);
    assert!(payment.value() == self.price, EInvalidPayment);
    self.funds.join(payment.into_balance());
    let admin_proof = dataset.authorize_object(&self.id);
    dataset.admin_allow_reader(&admin_proof, ctx.sender());

}

public fun change_price(self: &mut SuiPayPolicy, admin_proof: &AdminProof, new_price: u64) {
    assert!(admin_proof.dataset_id() == self.dataset_id, EInvalidAdminProof);
    self.price = new_price;
}

public fun withdraw_funds(self: &mut SuiPayPolicy, admin_proof: &AdminProof, ctx: &mut TxContext): Coin<SUI> {
    assert!(admin_proof.dataset_id() == self.dataset_id, EInvalidAdminProof);
    self.funds.withdraw_all().into_coin(ctx)
}
