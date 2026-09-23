import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('native invitation and authentication URL registration', () => {
  it('Android routes authentication callbacks and party links to the single-task activity', () => {
    const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
    const activity = manifest.match(/<activity\b[\s\S]*?<\/activity>/)?.[0] ?? '';
    expect(activity).toContain('android:launchMode="singleTask"');
    const filters = activity.match(/<intent-filter\b[\s\S]*?<\/intent-filter>/g) ?? [];
    for (const scheme of ['app.eventbliss', 'eventbliss']) {
      const filter = filters.find(value => value.includes(`android:scheme="${scheme}"`));
      expect(filter).toContain('android.intent.action.VIEW');
      expect(filter).toContain('android.intent.category.BROWSABLE');
      expect(filter).toContain('android.intent.category.DEFAULT');
    }
    expect(activity).toContain('android:pathPrefix="/party/join/"');
  });
  it('iOS registers the exact custom schemes used by auth and party invitations', () => {
    const plist = readFileSync('ios/App/App/Info.plist', 'utf8');
    const schemes = [...plist.matchAll(/<key>CFBundleURLSchemes<\/key>\s*<array>([\s\S]*?)<\/array>/g)].map(match => match[1]).join('');
    expect(schemes).toContain('<string>app.eventbliss</string>');
    expect(schemes).toContain('<string>eventbliss</string>');
  });
});
