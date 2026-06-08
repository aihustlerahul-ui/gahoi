# Gahoi Sarthi — API Response & Serialisation Patterns

Use this skill when creating or modifying any API endpoint or serialiser.

## Response envelope — always use this shape

{
success: boolean,
data: any | null,
error: string | null,
meta: { next_cursor?: string, total?: number }
}

## Pagination — cursor only, never offset

- All list endpoints use cursor-based pagination
- Never expose offset, skip, or page number parameters
- next_cursor is a base64-encoded UUID, never a row number
- Never return a total count in search/browse endpoints

## Three-tier profile serialisation — ALWAYS enforce this

serializeProfileCard() → free user or any list/search — no PII at all
serializeMaskedProfile() → paid user, no mutual interest — masked values
serializeFullProfile() → paid + mutual accepted interest — full PII

## Masking functions — always use these, never roll your own

import { maskPhone, maskEmail, maskAddress, maskName } from @gahoisarthi/shared/utils/masking
maskPhone('9827027044') → '9**\*\*\***4'
maskEmail('d@gmail.com') → 'd@gmail.com' (too short, returned as-is)
maskEmail('divya@gmail.com') → 'd***a@gmail.com'
maskAddress('Krishna Nagar, Satna') → '***, Satna'
maskName('Umesh Baderiya') → 'U\***\* B**\*\*\*\*\*'

## Fields NEVER returned in any API response

- time_of_birth (Kundli internal only)
- date_of_birth raw (always return calculated age as integer instead)
- password_hash (obvious)
