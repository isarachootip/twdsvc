import { pruneSensitive, parseDraft, serializeDraft } from '../../src/components/vendor-setup/draft-codec'
import { INITIAL_FORM } from '../../src/components/vendor-setup/initial-form'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function runDraftTests() {
  console.log('Running vendor-draft unit tests...')

  const dirty = structuredClone(INITIAL_FORM)
  dirty.store.name = 'ร้านทดสอบ'
  dirty.finance.accNo = '1234567890'
  dirty.finance.accName = 'ชื่อบัญชี'
  dirty.finance.documents = { idcard: '/u/id.png', company: '/u/c.png', license: '', portfolio: ['/u/p.png'] }
  dirty.agreements.signatureUrl = 'data:image/png;base64,AAAA'

  // Test 1: sensitive fields stripped, others preserved
  const pruned = pruneSensitive(dirty)
  assert(pruned.finance.accNo === '' && pruned.finance.accName === '', 'bank account must be stripped')
  assert(pruned.finance.documents.idcard === '' && pruned.finance.documents.portfolio.length === 0, 'documents must be stripped')
  assert(pruned.agreements.signatureUrl === '', 'signature must be stripped')
  assert(pruned.store.name === 'ร้านทดสอบ', 'non-sensitive data must be preserved')
  assert(dirty.finance.accNo === '1234567890', 'pruneSensitive must not mutate input')
  console.log('✔ Test 1: pruneSensitive strips sensitive fields without mutation')

  // Test 2: round trip
  const raw = serializeDraft(dirty, 3)
  assert(!raw.includes('1234567890') && !raw.includes('data:image/png'), 'serialized draft must not contain sensitive data')
  const back = parseDraft(raw)
  assert(back !== null && back.step === 3 && back.form.store.name === 'ร้านทดสอบ', 'draft must round-trip')
  console.log('✔ Test 2: serialize/parse round trip')

  // Test 3: corrupt / invalid drafts are discarded
  assert(parseDraft(null) === null, 'null → null')
  assert(parseDraft('{not json') === null, 'bad JSON → null')
  assert(parseDraft(JSON.stringify({ v: 1, step: 99, form: INITIAL_FORM })) === null, 'out-of-range step → null')
  assert(parseDraft(JSON.stringify({ v: 1, step: 2, form: { store: 1 } })) === null, 'bad shape → null')
  assert(parseDraft(JSON.stringify({ v: 0, step: 2, form: INITIAL_FORM })) === null, 'old version → null')
  console.log('✔ Test 3: invalid drafts discarded')

  console.log('All vendor-draft tests passed successfully!')
}

runDraftTests()
