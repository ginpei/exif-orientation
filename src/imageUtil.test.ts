import * as fs from 'fs';
import { ExifOrientation, getOrientation } from './imageUtil';

describe('imageUtil', () => {
  describe('getOrientation()', () => {
    const readFileAsUint8 = (name: string) => {
      const file = fs.readFileSync(`test/${name}`);
      const arr = new Uint8Array(file);
      return arr;
    };

    it('for original image', async () => {
      const arr = readFileAsUint8('000-1.jpg');
      const orientation = await getOrientation(arr);
      expect(orientation).toBe(ExifOrientation.original);
    });

    it('for image rotated 90 degree', async () => {
      const arr = readFileAsUint8('090-6.jpg');
      const orientation = await getOrientation(arr);
      expect(orientation).toBe(ExifOrientation.deg90);
    });

    it('for image rotated 180 degree', async () => {
      const arr = readFileAsUint8('180-3.jpg');
      const orientation = await getOrientation(arr);
      expect(orientation).toBe(ExifOrientation.deg180);
    });

    it('for image rotated 270 degree', async () => {
      const arr = readFileAsUint8('270-8.jpg');
      const orientation = await getOrientation(arr);
      expect(orientation).toBe(ExifOrientation.deg270);
    });

    it('for flipped image', async () => {
      const arr = readFileAsUint8('000-flipped-2.jpg');
      const orientation = await getOrientation(arr);
      expect(orientation).toBe(ExifOrientation.flipped);
    });

    it('for flipped image rotated 90 degree', async () => {
      const arr = readFileAsUint8('090-flipped-5.jpg');
      const orientation = await getOrientation(arr);
      expect(orientation).toBe(ExifOrientation.deg90Flipped);
    });

    it('for flipped image rotated 180 degree', async () => {
      const arr = readFileAsUint8('180-flipped-4.jpg');
      const orientation = await getOrientation(arr);
      expect(orientation).toBe(ExifOrientation.deg180Flipped);
    });

    it('for flipped image rotated 270 degree', async () => {
      const arr = readFileAsUint8('270-flipped-7.jpg');
      const orientation = await getOrientation(arr);
      expect(orientation).toBe(ExifOrientation.deg270Flipped);
    });
  });
});
