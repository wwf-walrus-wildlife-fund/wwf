# TuskBazaar — Decentralized Data Marketplace

Data marketplace dApp on Sui. Users upload, monetize, and purchase datasets.
Data is stored encrypted on **Walrus** (decentralized blob storage), access-controlled via **Seal** (threshold encryption).

## Project Structure

```
contracts/tuskbazaar/     # Sui Move smart contracts (edition 2024)
app/walrus-wildlife-fund/ # Next.js 15 frontend (App Router, React 19, Tailwind v4)
```

## Smart Contracts (`contracts/tuskbazaar/sources/`)

| Module | Purpose |
|--------|---------|
| `tusk_bazaar.move` | Namespace/factory — creates datasets holds global dataset counter |
| `account_cap.move` | AccountCap object: 1 per address, links to user's datasets |
| `dataset.move` | Core Dataset object: points to account_cap_id, admins, readers (dynamic fields), envelope (Seal-encrypted DEK), blob_ids (Walrus refs) |
| `seal_approve_reader.move` | Seal entry function — validates reader access for decryption (dry-run only, no side effects) |
| `pay_sui_to_be_reader.move` | Payment policy — pay SUI to become a dataset reader via derived actor object |

### Move Patterns

- **AccountCap**: 1 per address, created on first interaction. Links to all datasets the user owns. Transfer-restricted.
- **Namespace counter**: Global incrementing `u64` counter in Namespace object, used as derivation key for Dataset IDs
- **Derived objects**: `sui::derived_object` for deterministic addresses from `namespace_id + counter`
- **AdminProof**: Capability pattern — `authorize_address()` / `authorize_object()` returns proof
- **Reader access**: Dynamic fields with `Reader(address)` key on Dataset UID
- **Envelope**: `{ encrypted_key: vector<u8>, version: u64 }` — Seal-encrypted DEK with rotation version
- **blob_ids**: `VecSet<String>` (u256 stored as String for explorer readability)
- **Error constants**: `const EDescriptiveName: u64 = N`
- **Visibility**: `public(package)` for internal functions, `entry` for Seal approve

### Build & Test

```sh
cd contracts/tuskbazaar
sui move build
sui move test
```

## Flows

See also `flows.md` at project root for the on-chain flow summaries.

### Create Dataset (Upload)
1. Read current counter from Namespace to derive Dataset object ID (`namespace_id + counter`)
2. Generate random AES-256-GCM key (DEK)
3. Encrypt dataset file(s) with DEK → ciphertext
4. Store encrypted blob(s) on Walrus → get blob_id(s)
5. Encrypt DEK with Seal: `sealClient.encrypt({ threshold, packageId, id: [dataset_id || version_0], data: dek })` → encrypted envelope
6. Call `tusk_bazaar::new_dataset(namespace, account_cap, ...)` on-chain — increments counter, creates Dataset, links to AccountCap
7. Create PaySuiToBeReaderActor policy: `create_policy(dataset, admin_proof, price)` → share
8. `dataset.add_admin(actor)` so the actor can authorize readers

### Add Reader — By Admin
1. Admin calls `dataset.authorize_address(ctx)` → gets `AdminProof`
2. Admin calls `dataset.admin_allow_reader(admin_proof, reader_address)` → adds `Reader(address)` dynamic field
3. (Trigger can be off-chain, e.g. Ethereum payment verification, manual approval, etc.)

### Add Reader — By Paying SUI
1. User calls `pay_sui_to_be_reader::pay_to_read(actor, dataset, payment, ctx)`
2. Actor validates payment amount matches price
3. Actor calls `dataset.authorize_object(&self.id)` → gets `AdminProof` (actor is an admin)
4. Actor calls `dataset.admin_allow_reader(admin_proof, ctx.sender())`
5. User is now a reader — `Reader(user_address)` dynamic field exists on Dataset

### Read Dataset (Download + Decrypt)
1. Create a Seal `SessionKey` (TTL-limited, sign personal message with user's keypair)
2. Fetch Dataset object to get `blob_ids` and `envelope.version`
3. Build `seal_approve_reader` transaction:
   ```ts
   const tx = new Transaction();
   tx.moveCall({
     target: `${packageId}::seal_approve_reader::seal_approve_reader`,
     arguments: [
       tx.pure.vector('u8', identityBytes),  // [dataset_id (32) || version (8 LE)]
       tx.object(datasetId),
     ],
   });
   const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
   ```
4. Decrypt DEK: `sealClient.decrypt({ data: envelope.encrypted_key, sessionKey, txBytes })`
   - Seal key servers dry-run the tx to verify reader access
   - If `seal_approve_reader` doesn't abort → servers return identity-based private keys
   - Client reconstructs DEK from threshold shares
5. Fetch encrypted blob(s) from Walrus aggregator by blob_id
6. AES-256-GCM decrypt blob(s) with DEK → plaintext dataset

### Seal Details

- **SDK**: `@mysten/seal`
- **Identity bytes**: 40 bytes = `[dataset_id (32 bytes address)][envelope.version (8 bytes LE u64)]`
- **seal_approve**: Entry function, first param `id: vector<u8>`, must abort on denied access, NO state mutation
- **Session keys**: `SessionKey.create()` with TTL, reusable across decryptions
- **Encrypt**: `sealClient.encrypt({ threshold, packageId, id, data })` → returns `{ encryptedObject, key }`
- **Decrypt**: `sealClient.decrypt({ data, sessionKey, txBytes })` — txBytes from `seal_approve_reader` call built with `onlyTransactionKind: true`
- **Key rotation**: Increment envelope version, re-encrypt DEK with new Seal identity

### Walrus Details

- **Store**: HTTP PUT to publisher endpoint → returns blob_id
- **Read**: HTTP GET from aggregator endpoint `/v1/blobs/{blob_id}`
- **SDK**: `@mysten/walrus` or direct HTTP
- **Size limit**: 10 MiB default per blob (configurable), 100 MiB for quilts

## Testnet Configuration

```
# Seal
Seal Package (testnet): 0x4016869413374eaa71df2a043d1660ed7bc927ab7962831f8b07efbc7efdb2c3

# Walrus (testnet)
Publisher:  https://publisher.walrus-testnet.walrus.space
Aggregator: https://aggregator.walrus-testnet.walrus.space

# TuskBazaar (not yet deployed)
# Package ID: TBD (deploy with `sui client publish`)
```

## Frontend (`app/walrus-wildlife-fund/`)

- **Auth**: Enoki/zkLogin (Google OAuth), burner wallet in dev
- **Sui**: `@mysten/sui`, `@mysten/dapp-kit-react`
- **Sponsored txs**: Enoki sponsorship for gasless UX
- **Hooks**: `src/hooks/` — `useUpload`, `useBuy`, `useDecrypt`, `useFeed`, etc.
- **Config**: `.env` for Enoki keys + Google OAuth (see `.env.example`)

```sh
cd app/walrus-wildlife-fund
npm install
npm run dev
```

## Reference: groups-sdk Encryption Pattern

Key files in `~/Projects/Internal/groups-sdk` to reference:
- `ts-sdks/packages/messaging-groups/src/encryption/envelope-encryption.ts` — E2E encryption orchestrator
- `ts-sdks/packages/messaging-groups/src/encryption/dek-manager.ts` — Seal DEK management (generate, cache, decrypt)
- `ts-sdks/packages/messaging-groups/src/encryption/seal-policy.ts` — Building seal_approve transactions
- `move/packages/messaging/sources/seal_policies.move` — Move seal_approve + identity validation

## Documentation

- Walrus: https://docs.wal.app/
- Seal: https://seal-docs.wal.app/
- Seal SDK usage: https://seal-docs.wal.app/UsingSeal/
- Sui Move: https://docs.sui.io/
