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

const orientation = await exif.getOrientation(fileOrBuffer);
console.log(
  `${orientation.rotation} degree,`,
  orientation.flipped ? 'flipped' : 'not flipped',
);
```

## Examples

See https://github.com/ginpei/exif-orientation-example.

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

## API References

### import

```ts
import * as exif from '@ginpei/exif-orientation';
```

This package does not have `default`.

To import in TypeScript, you need to set `moduleResolution` option. Find detail in Q&A section below.

### `function getOrientation(input: File | Buffer | ArrayBuffer): Promise<IOrientationInfo | undefined>`

- `input: File | Buffer | ArrayBuffer` : JPEG file data.

If the input is not JPEG file with Exif containing orientation information, it returns `undefined`.

### `function readOrientationCode(input: File | Buffer | ArrayBuffer): Promise<OrientationCode>`

- `input: File | Buffer | ArrayBuffer` : JPEG file data.

### `enum OrientationCode`

- `OrientationCode.original`
- `OrientationCode.deg90`
- `OrientationCode.deg180`
- `OrientationCode.deg270`
- `OrientationCode.flipped`
- `OrientationCode.deg90Flipped`
- `OrientationCode.deg180Flipped`
- `OrientationCode.deg270Flipped`
- `OrientationCode.unknown`

### `function getOrientationInfo(orientation: OrientationCode): IOrientationInfo | undefined`

- `orientation: OrientationCode`

### `interface IOrientationInfo`

```ts
interface IOrientationInfo {
  rotation: number;
  flipped: boolean;
}
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

- 2019-01-06: v1.0.0
  - First Release

## License

- MIT License

## Contact

- by Ginpei
- GitHub: [ginpei](https://github.com/ginpei/)/[exif-orientation](https://github.com/ginpei/exif-orientation)
- Twitter: [@ginpei\_en](https://twitter.com/ginpei_en)
