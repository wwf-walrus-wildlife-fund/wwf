/// Module: tuskbazaar
module tusk_bazaar::tusk_bazaar {
    use std::string::String;
    use sui::{package::{Self, Publisher}, vec_set};
    use tusk_bazaar::dataset::{Self, Dataset};

    const EInvalidPublisher: u64 = 0;

    public struct TUSK_BAZAAR() has drop;

    public struct TuskBazaarNamespace has key {
        id: UID,
    }

    fun init(otw: TUSK_BAZAAR, ctx: &mut TxContext) {
        package::claim_and_keep(otw, ctx);
        transfer::share_object(TuskBazaarNamespace { id: object::new(ctx) });
    }

    // TODO: Use Minter object if time allows
    public fun new_dataset(
        self: &mut TuskBazaarNamespace,
        publ: &Publisher,
        der_key: String,
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
            der_key,
            vec_set::from_keys(admins),
            name,
            description,
            image_url,
            project,
            project_url,
            envelope,
            vec_set::from_keys(blob_ids),
        )
    }
}
