const USDT_JETTON_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs'
const TON_CENTER_BASE = 'https://toncenter.com/api/v2'

export function buildTonPaymentUri(toAddress: string, amountUsd: number, memo: string): string {
  const nanoAmount = Math.round(amountUsd * 1_000_000)
  const params = new URLSearchParams({
    amount: nanoAmount.toString(),
    jetton: USDT_JETTON_MASTER,
    text: memo,
  })
  return `ton://transfer/${toAddress}?${params.toString()}`
}

export function parseTonAmount(nanoAmount: string): number {
  return parseInt(nanoAmount, 10) / 1_000_000
}

export interface TonTx {
  hash: string
  amount: number
  memo: string
}

export async function findIncomingUsdtTx(
  walletAddress: string,
  expectedMemo: string,
  minAmountUsd: number,
): Promise<TonTx | null> {
  const apiKey = process.env.TON_CENTER_API_KEY ?? ''
  const headers: Record<string, string> = apiKey ? { 'X-API-Key': apiKey } : {}

  const url = `${TON_CENTER_BASE}/getJettonTransfers?` +
    new URLSearchParams({
      address: walletAddress,
      jetton_master: USDT_JETTON_MASTER,
      limit: '20',
      direction: 'in',
    })

  const res = await fetch(url, { headers, cache: 'no-store' })
  if (!res.ok) return null

  const data = await res.json()
  const transfers: Array<{ transaction_hash: string; amount: string; comment?: string }> =
    data.result ?? []

  for (const tx of transfers) {
    const amount = parseTonAmount(tx.amount)
    if ((tx.comment ?? '') === expectedMemo && amount >= minAmountUsd) {
      return { hash: tx.transaction_hash, amount, memo: tx.comment ?? '' }
    }
  }
  return null
}
