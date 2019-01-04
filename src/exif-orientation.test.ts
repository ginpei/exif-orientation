import * as fs from 'fs';
import { getOrientation, Orientation } from './exif-orientation';

describe('imageUtil', () => {
  describe('getOrientation()', () => {
    it('accepts Buffer', async () => {
      const buffer = fs.readFileSync(`test/000-1.jpg`);
      const orientation = await getOrientation(buffer.buffer);
      expect(orientation).toBe(Orientation.original);
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
      expect(orientation).toBe(Orientation.original);
    });

    describe('recognize orientation from file of', () => {
      const readFile = (name: string) => {
        const buffer = fs.readFileSync(`test/${name}`);
        return buffer.buffer;
      };

      it('original image', async () => {
        const arr = readFile('000-1.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toBe(Orientation.original);
      });

      it('image rotated 90 degree', async () => {
        const arr = readFile('090-6.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toBe(Orientation.deg90);
      });

      it('image rotated 180 degree', async () => {
        const arr = readFile('180-3.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toBe(Orientation.deg180);
      });

      it('image rotated 270 degree', async () => {
        const arr = readFile('270-8.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toBe(Orientation.deg270);
      });

      it('flipped image', async () => {
        const arr = readFile('000-flipped-2.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toBe(Orientation.flipped);
      });

      it('flipped image rotated 90 degree', async () => {
        const arr = readFile('090-flipped-5.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toBe(Orientation.deg90Flipped);
      });

      it('flipped image rotated 180 degree', async () => {
        const arr = readFile('180-flipped-4.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toBe(Orientation.deg180Flipped);
      });

      it('flipped image rotated 270 degree', async () => {
        const arr = readFile('270-flipped-7.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toBe(Orientation.deg270Flipped);
      });

      it('image without Exif', async () => {
        const arr = readFile('no-exif.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toBe(Orientation.unknown);
      });

      it('non-JPEG image', async () => {
        const arr = readFile('png.png');
        const orientation = await getOrientation(arr);
        expect(orientation).toBe(Orientation.unknown);
      });

      it('empty file', async () => {
        const arr = readFile('empty.txt');
        const orientation = await getOrientation(arr);
        expect(orientation).toBe(Orientation.unknown);
      });
    });
  });
});
