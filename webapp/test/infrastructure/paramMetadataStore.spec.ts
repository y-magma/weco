import { describe, expect, it } from 'vitest'
import { ParamMetadataStore } from '@domain/services/paramMetadataStore'

describe('ParamMetadataStore', () => {
  it('keys entries by sourceId, country and variable', () => {
    const store = new ParamMetadataStore()
    const availability = {
      combos: [{ age: '992', pop: 'j' }],
      ages: ['992'],
      pops: ['j'],
    }

    store.set('wid', 'FR', 'ahweal', availability)
    store.set('oecd-idd', 'FR', 'ahweal', {
      combos: [{ age: '999', pop: 'i' }],
      ages: ['999'],
      pops: ['i'],
    })

    expect(store.get('wid', 'FR', 'ahweal')).toEqual(availability)
    expect(store.get('oecd-idd', 'FR', 'ahweal')?.combos[0]).toEqual({ age: '999', pop: 'i' })
    expect(store.get('wid', 'US', 'ahweal')).toBeUndefined()
  })
})
