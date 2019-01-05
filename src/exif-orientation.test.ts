import * as fs from 'fs';
import { getOrientation } from './exif-orientation';

describe('imageUtil', () => {
  describe('getOrientation()', () => {
    it('accepts Buffer', async () => {
      const buffer = fs.readFileSync(`test/000-1.jpg`);
      const orientation = await getOrientation(buffer.buffer);
      expect(orientation).toEqual({ rotation: 0, flipped: false });
    });

    it('accepts ArrayBuffer', async () => {
      // ArrayBuffer is general
      const buffer = fs.readFileSync(`test/000-1.jpg`);
      const arrayBuffer = new ArrayBuffer(buffer.byteLength);
      const view = new DataView(arrayBuffer);
      buffer.forEach((value, index) => {
        view.setUint8(index, value);
      });

      const orientation = await getOrientation(arrayBuffer);
      expect(orientation).toEqual({ rotation: 0, flipped: false });
    });

    describe('recognize orientation from file of', () => {
      const readFile = (name: string) => {
        const buffer = fs.readFileSync(`test/${name}`);
        return buffer.buffer;
      };

      it('original image', async () => {
        const arr = readFile('000-1.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toEqual({ rotation: 0, flipped: false });
      });

      it('image rotated 90 degree', async () => {
        const arr = readFile('090-6.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toEqual({ rotation: 90, flipped: false });
      });

      it('image rotated 180 degree', async () => {
        const arr = readFile('180-3.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toEqual({ rotation: 180, flipped: false });
      });

      it('image rotated 270 degree', async () => {
        const arr = readFile('270-8.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toEqual({ rotation: 270, flipped: false });
      });

      it('flipped image', async () => {
        const arr = readFile('000-flipped-2.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toEqual({ rotation: 0, flipped: true });
      });

      it('flipped image rotated 90 degree', async () => {
        const arr = readFile('090-flipped-5.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toEqual({ rotation: 90, flipped: true });
      });

      it('flipped image rotated 180 degree', async () => {
        const arr = readFile('180-flipped-4.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toEqual({ rotation: 180, flipped: true });
      });

      it('flipped image rotated 270 degree', async () => {
        const arr = readFile('270-flipped-7.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toEqual({ rotation: 270, flipped: true });
      });

      it('image without Exif', async () => {
        const arr = readFile('no-exif.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toBeUndefined();
      });

      it('non-JPEG image', async () => {
        const arr = readFile('png.png');
        const orientation = await getOrientation(arr);
        expect(orientation).toBeUndefined();
      });

      it('empty file', async () => {
        const arr = readFile('empty.txt');
        const orientation = await getOrientation(arr);
        expect(orientation).toBeUndefined();
      });
    });
  });
});
