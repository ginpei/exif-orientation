export enum OrientationCode {
  original = 1,
  deg90 = 6,
  deg180 = 3,
  deg270 = 8,
  flipped = 2,
  deg90Flipped = 5,
  deg180Flipped = 4,
  deg270Flipped = 7,
  unknown = -1,
}

export interface IOrientationInfo {
  rotation: number;
  flipped: boolean;
}

const orientationInfoMap: { [orientation: number]: IOrientationInfo } = {
  [OrientationCode.original]: { rotation: 0, flipped: false },
  [OrientationCode.deg90]: { rotation: 90, flipped: false },
  [OrientationCode.deg180]: { rotation: 180, flipped: false },
  [OrientationCode.deg270]: { rotation: 270, flipped: false },
  [OrientationCode.flipped]: { rotation: 0, flipped: true },
  [OrientationCode.deg90Flipped]: { rotation: 90, flipped: true },
  [OrientationCode.deg180Flipped]: { rotation: 180, flipped: true },
  [OrientationCode.deg270Flipped]: { rotation: 270, flipped: true },
};

// tslint:disable:object-literal-sort-keys
const statics = {
  jpeg: 0xffd8,
  exifMarker: 0xffe1,
  exifId: 0x45786966, // "E", "X", "I", "F"
  orderLittleEndian: 0x4949,
  endianAssertion: 0x002a,
  ifdFieldCountLength: 2,
  orientationTag: 0x0112,
  offsets: {
    firstMarker: 2,
    segment: {
      marker: 0,
      length: 2,
      exifId: 4,
    },
    tiffHeader: {
      fromSegment: 10,
      byteOrder: 0,
      endianAssertion: 2,
      ifdOffset: 4,
    },
    ifd: {
      fromTiffHeader: -1,
      tag: 0,
      type: 2,
      count: 4,
      value: 8,
    },
  },
};
// tslint:enable:object-literal-sort-keys

function sleep (ms: number) {
  return new Promise((done) => setTimeout(done, ms));
}

/**
 * If the input is not JPEG file with Exif containing orientation information,
 * it returns `undefined`.
 * @param input JPEG file data.
 */
export async function getOrientation (
  input: File | Buffer | ArrayBuffer,
): Promise<IOrientationInfo | undefined> {
  const code = await readOrientationCode(input);
  const info = getOrientationInfo(code);
  return info;
}

/**
 * @see http://www.cipa.jp/std/documents/j/DC-008-2012_J.pdf
 */
export async function readOrientationCode (
  input: File | Buffer | ArrayBuffer,
): Promise<OrientationCode> {
  const view = await prepareDataView(input);
  if (!isValidJpeg(view)) {
    return OrientationCode.unknown;
  }

  const segmentOffset = await findExifSegmentOffset(view);
  if (segmentOffset < 0) {
    return OrientationCode.unknown;
  }

  const tiffHeaderOffset =
    segmentOffset + statics.offsets.tiffHeader.fromSegment;
  const littleEndian = isLittleEndian(view, tiffHeaderOffset);
  const ifdPosition = findIfdPosition(view, tiffHeaderOffset, littleEndian);
  const ifdFieldOffset = ifdPosition + statics.ifdFieldCountLength;

  const orientationOffset = findOrientationOffset(
    view,
    ifdFieldOffset,
    littleEndian,
  );
  if (orientationOffset < 0) {
    console.warn('Rotation information was not found');
    return OrientationCode.unknown;
  }

  const orientation = readOrientationValueAt(
    view,
    orientationOffset,
    littleEndian,
  );
  return orientation;
}

async function prepareDataView (
  input: File | Buffer | ArrayBuffer,
): Promise<DataView> {
  // To run on both browser and Node.js,
  // need to check constructors existences before checking instance

  let arrayBuffer;
  if (typeof File !== 'undefined' && input instanceof File) {
    arrayBuffer = await readFile(input);
  } else if (typeof Buffer !== 'undefined' && input instanceof Buffer) {
    arrayBuffer = input.buffer;
  } else {
    arrayBuffer = input as ArrayBuffer;
  }

  const view = new DataView(arrayBuffer);
  return view;
}

async function readFile (file: File) {
  const arrayBuffer = await new Promise<ArrayBuffer>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(file);
  });

  return arrayBuffer;
}

function isValidJpeg (view: DataView) {
  return view.byteLength >= 2 && view.getUint16(0, false) === statics.jpeg;
}

/**
 * Returns `-1` if not found.
 */
async function findExifSegmentOffset (view: DataView) {
  for await (const segmentPosition of iterateMarkerSegments(view)) {
    if (isExifSegment(view, segmentPosition)) {
      assertExifSegment(view, segmentPosition);
      return segmentPosition;
    }
  }

  // not found
  return -1;
}

async function* iterateMarkerSegments (view: DataView) {
  // APPx/Exif p.18, 19, 150
  // - marker (short) `0xffe1` = APP1
  // - length (short) of segment
  // - padding (short) `0x0000` if exif
  // - "EXIF" (char[4]) if exif
  // - content
  // (The doc describe APP1 have to lay next to the SOI,
  //  however, Photoshop renders a JPEG file that SOI is followed by APP0.)

  let segmentPosition = statics.offsets.firstMarker;
  while (true) {
    // just in case
    await sleep(1);

    yield segmentPosition;

    const offsetLength = statics.offsets.segment.length;
    const length =
      offsetLength + view.getUint16(segmentPosition + offsetLength, false);
    segmentPosition += length;

    if (segmentPosition > view.byteLength) {
      console.warn('APP1 not found');
      return -1;
    }
  }
}

function isExifSegment (view: DataView, segmentPosition: number) {
  const marker = view.getUint16(
    segmentPosition + statics.offsets.segment.marker,
    false,
  );
  return marker === statics.exifMarker;
}

function assertExifSegment (view: DataView, segmentPosition: number) {
  // p 150

  const id = view.getUint32(
    segmentPosition + statics.offsets.segment.exifId,
    false,
  );
  if (id !== statics.exifId) {
    throw new Error('Segment marked as Exif does not have Exif identifier');
  }
}

function isLittleEndian (view: DataView, tiffHeaderOffset: number) {
  const endian = view.getUint16(
    tiffHeaderOffset + statics.offsets.tiffHeader.byteOrder,
    false,
  );
  const littleEndian = endian === statics.orderLittleEndian;
  return littleEndian;
}

function findIfdPosition (
  view: DataView,
  tiffHeaderOffset: number,
  littleEndian: boolean | undefined,
) {
  // TIFF Header p.17
  // - byte order (short). `0x4949` = little, `0x4d4d` = big
  // - 42 (0x002a) (short)
  // - offset of IFD (long). Minimum is `0x00000008` (8).

  const endianAssertionValue = view.getUint16(
    tiffHeaderOffset + statics.offsets.tiffHeader.endianAssertion,
    littleEndian,
  );
  if (endianAssertionValue !== statics.endianAssertion) {
    throw new Error(
      `Invalid JPEG format: littleEndian ${littleEndian}, assertion: 0x${endianAssertionValue}`,
    );
  }

  const ifdDistance = view.getUint32(
    tiffHeaderOffset + statics.offsets.tiffHeader.ifdOffset,
    littleEndian,
  );

  const ifdPosition = tiffHeaderOffset + ifdDistance;
  return ifdPosition;
}

function findOrientationOffset (
  view: DataView,
  ifdFieldOffset: number,
  littleEndian: boolean,
) {
  const fieldIterator = iterateIfdFields(view, ifdFieldOffset, littleEndian);
  for (const offset of fieldIterator) {
    const tag = view.getUint16(ifdFieldOffset + offset, littleEndian);
    if (tag === statics.orientationTag) {
      const orientationValueOffset =
        ifdFieldOffset + offset + statics.offsets.ifd.value;
      return orientationValueOffset;
    }
  }

  return -1;
}

function* iterateIfdFields (
  view: DataView,
  ifdFieldOffset: number,
  littleEndian: boolean,
) {
  // IFD p.23
  // - num of IFD fields (short)
  // - IFD:
  //   - tag (short)
  //   - type (short)
  //   - count (long)
  //   - value offset (long)
  // - IFD...

  const numOfIfdFields = view.getUint16(ifdFieldOffset, littleEndian);
  const fieldLength = 12;
  for (let i = 0; i < numOfIfdFields; i++) {
    const currentOffset = i * fieldLength;
    yield currentOffset;
  }
}

function readOrientationValueAt (
  view: DataView,
  offset: number,
  littleEndian: boolean,
) {
  const orientation = view.getUint16(offset, littleEndian);
  return orientation;
}

/**
 * Converts orientation code specified in Exif to readable information.
 * @param input JPEG file data.
 */
export function getOrientationInfo (
  orientation: OrientationCode,
): IOrientationInfo | undefined {
  return orientationInfoMap[orientation];
}
