import * as fs from 'fs';
import { getOrientation, OrientationCode, updateOrientationCode } from './index';

describe('imageUtil', () => {
  const readFile = (name: string) => {
    const buffer = fs.readFileSync(`test/${name}`);
    return buffer.buffer;
  };

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

      // TODO prepare test file
      it.skip('image without orientation', async () => {
        const arr = readFile('no-orientation.jpg');
        const orientation = await getOrientation(arr);
        expect(orientation).toBeUndefined();
      });

      it('image with non-Exif APP1 before Exif APP1', async () => {
        const arr = readFile('xml-before-exif.jpg');
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

  describe('updateOrientationCode()', () => {
    it('accepts Buffer', async () => {
      const buffer = fs.readFileSync('test/000-flipped-2.jpg');
      await updateOrientationCode(buffer.buffer, OrientationCode.original);
      const orientation = await getOrientation(buffer.buffer);
      expect(orientation).toEqual({ rotation: 0, flipped: false });
    });

    it('accepts ArrayBuffer', async () => {
      const buffer = fs.readFileSync('test/000-flipped-2.jpg');
      const arrayBuffer = new ArrayBuffer(buffer.byteLength);
      const view = new DataView(arrayBuffer);
      buffer.forEach((value, index) => {
        view.setUint8(index, value);
      });
      await updateOrientationCode(arrayBuffer, OrientationCode.original);

      const orientation = await getOrientation(arrayBuffer);
      expect(orientation).toEqual({ rotation: 0, flipped: false });
    });

    describe('update orientation from file of', () => {
      it('flipped image update orientation', async () => {
        const arr = readFile('000-flipped-2.jpg');
        await updateOrientationCode(arr, OrientationCode.original);
        const orientation = await getOrientation(arr);
        expect(orientation).toEqual({ rotation: 0, flipped: false });
      });

      it('image without Exif', async () => {
        const arr = readFile('no-exif.jpg');
        const errorMessage = 'The File you are trying to update has no exif data';

        try {
          await updateOrientationCode(arr, OrientationCode.original);
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });

      it('non-JPEG image', async () => {
        const arr = readFile('png.png');
        const errorMessage = 'The File you are trying to update is not a jpeg';

        try {
          await updateOrientationCode(arr, OrientationCode.original);
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });

      it('empty file', async () => {
        const arr = readFile('empty.txt');
        const errorMessage = 'The File you are trying to update is not a jpeg';

        try {
          await updateOrientationCode(arr, OrientationCode.original);
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });
    });
  });
});
