module tusk_bazaar::seal_approve_reader {
    use sui::bcs;
    use tusk_bazaar::dataset::Dataset;

    const EInvalidDataset: u64 = 0;
    const EInvalidEnvelopeVersion: u64 = 1;
    const EInvalidIdentityBytes: u64 = 2;
    const ENotReader: u64 = 3;

    /// 32 (dataset_id) + 8 (envelope.version)
    const IDENTITY_BYTES_LEN: u64 = 40;

    entry fun seal_approve_reader(id: vector<u8>, dataset: &Dataset, ctx: &TxContext) {
        assert!(id.length() == IDENTITY_BYTES_LEN, EInvalidIdentityBytes);

        let mut bcs = bcs::new(id);
        let dataset_id = bcs.peel_address();
        assert!(object::id(dataset).to_address() == dataset_id, EInvalidDataset);
        assert!(dataset.envelope_version() == bcs.peel_u64(), EInvalidEnvelopeVersion);
        assert!(dataset.is_reader(ctx.sender()), ENotReader);
    }
}
