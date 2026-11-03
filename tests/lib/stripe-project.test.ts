import { describe, expect, it } from 'vitest';
import {
  STRIPE_PROJECT,
  classifyStripeProject,
  getStripeProject,
  withStripeProject,
} from '../../supabase/functions/_shared/stripe-project';

describe('stripe project isolation helper', () => {
  it('uses EVENT as the EventBliss project tag', () => {
    expect(STRIPE_PROJECT).toBe('EVENT');
  });

  it('classifies EventBliss objects as own', () => {
    expect(classifyStripeProject({ project: 'EVENT' })).toBe('own');
    expect(classifyStripeProject({ project: ' event ' })).toBe('own');
  });

  it.each(['WEALTH', 'TRACK', 'BOOK', 'CONTACT', 'other'])('classifies project=%s as foreign', project => {
    expect(classifyStripeProject({ project, user_id: 'u1' })).toBe('foreign');
  });

  it('classifies missing or empty tags as untagged', () => {
    expect(classifyStripeProject(null)).toBe('untagged');
    expect(classifyStripeProject(undefined)).toBe('untagged');
    expect(classifyStripeProject({})).toBe('untagged');
    expect(classifyStripeProject({ project: '' })).toBe('untagged');
    expect(classifyStripeProject({ project: '   ' })).toBe('untagged');
    expect(classifyStripeProject({ household_id: 'h1' })).toBe('untagged');
  });

  it('reads the normalized project tag', () => {
    expect(getStripeProject({ project: 'wealth' })).toBe('WEALTH');
    expect(getStripeProject({})).toBeNull();
  });

  it('adds project=EVENT without mutating the input', () => {
    const input = { user_id: 'u1', plan_type: 'monthly' };
    const tagged = withStripeProject(input);
    expect(tagged).toEqual({ user_id: 'u1', plan_type: 'monthly', project: 'EVENT' });
    expect(input).not.toHaveProperty('project');
    expect(withStripeProject()).toEqual({ project: 'EVENT' });
    expect(withStripeProject({ project: 'WEALTH' })).toEqual({ project: 'EVENT' });
  });

  it('tags round-trip as own', () => {
    expect(classifyStripeProject(withStripeProject({ booking_id: 'b1' }))).toBe('own');
  });
});
