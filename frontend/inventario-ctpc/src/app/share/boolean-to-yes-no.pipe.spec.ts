import { BooleanToYesNoPipe } from './boolean-to-yes-no.pipe';

describe('BooleanToYesNoPipe', () => {
  it('create an instance', () => {
    const pipe = new BooleanToYesNoPipe();
    expect(pipe).toBeTruthy();
  });
});
