// Using SUI for now for convenience
module tusk_bazaar::pay_sui_to_be_reader {
    use std::string::String;
    use sui::{coin::Coin, derived_object, sui::SUI};
    use tusk_bazaar::dataset::{AdminProof, Dataset};

    const EInvalidAdminProof: u64 = 0;
    const EInvalidDatasetActorCombination: u64 = 1;
    const EInvalidPayment: u64 = 2;

    public struct PaySuiToBeReaderActor has key {
        id: UID,
        derivation_key: String,
        dataset_id: ID,
        price: u64,
        funds_receiver: address,
    }

    public fun create_actor(
        parent: &mut Dataset,
        admin_proof: &AdminProof,
        price: u64,
        funds_receiver: address,
    ): PaySuiToBeReaderActor {
        assert!(admin_proof.is_authorized(parent), EInvalidAdminProof);
        let derivation_key = b"PaySuiToBeReaderActor".to_string();
        let id = derived_object::claim(parent.uid_mut(), derivation_key);
        PaySuiToBeReaderActor {
            id,
            derivation_key,
            dataset_id: object::id(parent),
            price,
            funds_receiver,
        }
    }

    public fun share(self: PaySuiToBeReaderActor) {
        transfer::share_object(self)
    }

    public fun pay_to_read(
        self: &mut PaySuiToBeReaderActor,
        dataset: &mut Dataset,
        payment: Coin<SUI>,
        ctx: &TxContext,
    ) {
        assert!(self.dataset_id == object::id(dataset), EInvalidDatasetActorCombination);
        assert!(payment.value() == self.price, EInvalidPayment);
        transfer::public_transfer(payment, self.funds_receiver);
        let admin_proof = dataset.authorize_object(&self.id);
        dataset.admin_allow_reader(&admin_proof, ctx.sender());
    }

    public fun change_price(
        self: &mut PaySuiToBeReaderActor,
        admin_proof: &AdminProof,
        new_price: u64,
    ) {
        assert!(admin_proof.dataset_id() == self.dataset_id, EInvalidAdminProof);
        self.price = new_price;
    }
}
