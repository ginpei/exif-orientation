# Exif orientation

[![Build Status](https://travis-ci.org/ginpei/exif-orientation.svg?branch=master)](https://travis-ci.org/ginpei/exif-orientation)
[![Greenkeeper badge](https://badges.greenkeeper.io/ginpei/exif-orientation.svg)](https://greenkeeper.io/)
[![Maintainability](https://api.codeclimate.com/v1/badges/022850f0f474ca642afe/maintainability)](https://codeclimate.com/github/ginpei/exif-orientation/maintainability)

Get orientation (rotation and flipping) info from Exif-ed JPEG.

## Usage

```
npm install @ginpei/exif-orientation
```

```ts
import * as exif from '@ginpei/exif-orientation';

const elFile = document.querySelector<HTMLInputElement>('#file');
elFile.addEventListener('change', async (event) => {
  const file = event.target.files[0];

  // get orientation
  const orientation = await exif.getOrientation(file);

  // find orientation information
  const info = exif.getOrientationInfo(orientation);
  console.log(
    `Rotated ${info.rotation} degree,`,
    flipped ? 'flipped' : 'not flipped',
  );
});
```

## API References

### import

```ts
import * as exif from '@ginpei/exif-orientation';
```

This package does not have `default`.

To import in TypeScript, you would need to set `moduleResolution` option. Find detail in Q&A section below.

### `function getOrientation(input: File | Buffer | ArrayBuffer): Promise<Orientation>`

- `arr: File | Buffer | ArrayBuffer` : JPEG file data.

### `enum Orientation`

- `Orientation.original`
- `Orientation.deg90`
- `Orientation.deg180`
- `Orientation.deg270`
- `Orientation.flipped`
- `Orientation.deg90Flipped`
- `Orientation.deg180Flipped`
- `Orientation.deg270Flipped`
- `Orientation.unknown`

### `function getOrientationInfo(orientation: Orientation): IOrientationInfo | undefined`

```ts
interface IOrientationInfo {
  rotation: number;
  flipped: boolean;
}
```

## Examples

### Read file from `<input type="file">`

```ts
// get file accessor
const elFile = document.querySelector<HTMLInputElement>('#file');
const file = elFile.files[0];

// get orientation
const orientation = await exif.getOrientation(file);
```

### Read file from `fs.readFile()`

```js
// read file as buffer
const buffer = fs.readFileSync(path);

// get orientation
const orientation = await exif.getOrientation(buffer);
```

## Q&A

## Exif?

Exif is a kind of data format inside JPEG image file. It can contain rotation and flipping information.

If you see an image rotated weirdly, it might be caused by lacking logic for this Exif orientation information.

- [Exif - Wikipedia](https://en.wikipedia.org/wiki/Exif)

### Cannot find module '@ginpei/exif-orientation'

```
src/index.ts:1:23 - error TS2307: Cannot find module '@ginpei/exif-orientation'.

1 import * as exif from '@ginpei/exif-orientation';
                        ~~~~~~~~~~~~~~~~~~~~~~~~~~


Found 1 error.
```

You have to set `moduleResolution` in either way:

- In `tsconfig.json`: `"moduleResolution": "node"`
- From CLI: `--moduleResolution node`

See:

- [Compiler Options · TypeScript](https://www.typescriptlang.org/docs/handbook/compiler-options.html)

## History

- 2019-00-00: v1.0.0
  - First Release

## License

- MIT License

## Contact

- by Ginpei
- GitHub: [ginpei](https://github.com/ginpei/exif-orientation)/[exif-orientation](https://github.com/ginpei/exif-orientation)
- Twitter: [@ginpei\_en](https://twitter.com/ginpei_en)
