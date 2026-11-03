import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  AVATARS,
  AVATAR_COLOR_ORDER,
  pickAvatar,
  resolveAvatar,
} from './avatars'

describe('AVATARS grouping', () => {
  it('registers every image in public/avatars and vice versa', () => {
    const dir = join(process.cwd(), 'public', 'avatars')
    const diskKeys = readdirSync(dir)
      .filter(f => f.endsWith('.jpg'))
      .map(f => f.replace(/\.jpg$/, ''))
      .sort()
    const codeKeys = AVATARS.map(a => a.key).sort()
    expect(codeKeys).toEqual(diskKeys)
  })

  it('orders avatars contiguously by color', () => {
    const seenColors: string[] = []
    for (const avatar of AVATARS) {
      if (seenColors[seenColors.length - 1] !== avatar.color) {
        seenColors.push(avatar.color)
      }
    }
    expect(seenColors).toEqual(AVATAR_COLOR_ORDER)
  })
})

describe('pickAvatar', () => {
  it('hands out every picture once before doubling any up', () => {
    const taken: string[] = []
    for (let i = 0; i < AVATARS.length; i++) taken.push(pickAvatar(taken))

    expect(new Set(taken).size).toBe(AVATARS.length)
    // One more than there are pictures: shares one, but never piles onto a doubled one
    taken.push(pickAvatar(taken))
    taken.push(pickAvatar(taken))
    expect(new Set(taken.slice(-2)).size).toBe(2)
  })

  it('mostly picks from the cheeky pool while it has free pictures', () => {
    expect(AVATARS.find(a => a.key === pickAvatar([], () => 0))?.cheeky).toBe(true)
    expect(AVATARS.find(a => a.key === pickAvatar([], () => 0.99))?.cheeky).toBeFalsy()
  })

  it('falls back to the other pool once one runs out', () => {
    const cheeky = AVATARS.filter(a => a.cheeky).map(a => a.key)
    expect(AVATARS.find(a => a.key === pickAvatar(cheeky, () => 0))?.cheeky).toBeFalsy()
  })

  it('ignores missing and unknown keys', () => {
    expect(AVATARS.map(a => a.key)).toContain(pickAvatar([null, 'gone-picture']))
  })
})

describe('resolveAvatar', () => {
  it('uses the stored key, else a stable pick from the seed', () => {
    expect(resolveAvatar('gryla', 'x').key).toBe('gryla')
    expect(resolveAvatar(null, 'participant-1')).toBe(resolveAvatar(undefined, 'participant-1'))
  })
})
