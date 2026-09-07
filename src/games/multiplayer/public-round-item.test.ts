import { describe, expect, it } from 'vitest';
import { publicRoundItem } from './public-round-item';
describe('solution release', () => {
  it('does not send answer keys or alternative answers before reveal', () => {
    const item = { id:'q1',question:'How many?',answer:735,aliases:['secret'],sourceUrl:'secret-source' };
    const publicItem=publicRoundItem(item,false,['answer','aliases','sourceUrl']);
    expect(publicItem).toEqual({id:'q1',question:'How many?'});
    expect(item.answer).toBe(735);
    expect(publicRoundItem(item,true,['answer','aliases','sourceUrl'])).toEqual(item);
  });
  it('hides song metadata and QR lookup while preserving its round identity', () => {
    const song={id:'round-song',title:'Hidden',artist:'Hidden artist',year:1971,qrPayload:'spotify:lookup'};
    expect(publicRoundItem(song,false,['title','artist','year','qrPayload'])).toEqual({id:'round-song'});
    expect(publicRoundItem(null,false,[])).toBeNull();
  });
});
