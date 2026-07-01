import { loadGameContent } from '@facet/content'
import { describe, expect, it } from 'vitest'
import { contentWithTinyWave1, WAVE1_CLEAR_REPLAY } from './fixtures/wave1-clear.js'
import { runReplay } from './run-replay.js'
import { hashRunState } from './state-hash.js'

describe('replay harness', () => {
  const content = contentWithTinyWave1(loadGameContent())

  it('replays deterministically for the same script', () => {
    const first = runReplay(content, WAVE1_CLEAR_REPLAY)
    const second = runReplay(content, WAVE1_CLEAR_REPLAY)

    expect(hashRunState(first)).toBe(hashRunState(second))
    expect(first.level).toBe(2)
    expect(first.phase).toBe('placement')
  })

  it('matches golden state hash for wave-1 clear fixture', () => {
    const controller = runReplay(content, WAVE1_CLEAR_REPLAY)
    expect(hashRunState(controller)).toBe(
      '5849d4ea8996954fbfb4a2665f24c616fa68f51df26007835cfa6d0bc10766a4',
    )
  })
})
