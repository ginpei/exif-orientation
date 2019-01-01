import * as fs from 'fs';
import { ExifOrientation, getOrientation } from './imageUtil';

const testCases = new Map<string, ExifOrientation>([
  ['000-1.jpg', ExifOrientation.original],
  ['090-6.jpg', ExifOrientation.deg90],
  ['180-3.jpg', ExifOrientation.deg180],
  ['270-8.jpg', ExifOrientation.deg270],
  ['000-flipped-2.jpg', ExifOrientation.flipped],
  ['090-flipped-5.jpg', ExifOrientation.deg90Flipped],
  ['180-flipped-4.jpg', ExifOrientation.deg180Flipped],
  ['270-flipped-7.jpg', ExifOrientation.deg270Flipped],
]);

Promise.all(
  [...testCases.keys()].map(async (name) => {
    const file = fs.readFileSync(`test/${name}`);
    const arr = new Uint8Array(file);
    const result: [string, ExifOrientation] = [name, await getOrientation(arr)];
    return result;
  }),
).then((results) => {
  results.map(([name, result]) => {
    const expected = testCases.get(name);
    if (expected !== result) {
      console.warn(`Unmatched: "${name}" should be ${expected} but ${result}`);
      process.exit(1);
    }
  });
  console.log('OK, all clear!');
});
