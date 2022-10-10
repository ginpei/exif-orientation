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

const JPEG_HEADER = 0xffd8;
const APP1_MARKER = 0xffe1;
const APP1_EXIF_ID = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]; // "Exif\0\0"
const ORDER_LITTLE_ENDIAN = 0x4949;
const ENDIAN_ASSERTION = 0x002a;
const IFD_FIELD_COUNT_LENGTH = 2;
const ORIENTATION_TAG = 0x0112;
const FIRST_MARKER_OFFSET = 2;
const SEGMENT_MARKER_OFFSET = 0;
const SEGMENT_LENGTH_OFFSET = 2;
const SEGMENT_EXIF_ID_OFFSET = 4;
const TIFF_HEADER_FROM_SEGMENT_OFFSET = 10;
const TIFF_HEADER_BYTE_ORDER_OFFSET = 0;
const TIFF_HEADER_ENDIAN_ASSERTION_OFFSET = 2;
const TIFF_HEADER_IFD_OFFSET = 4;
// Unused:
// const IFD_FROM_TIFF_HEADER_OFFSET = -1;
// const IFD_TAG_OFFSET = 0;
// const IFD_TYPE_OFFSET = 2;
// const IFD_COUNT_OFFSET = 4;
const IFD_VALUE_OFFSET = 8;

function sleep(ms: number) {
  return new Promise((done) => setTimeout(done, ms));
}

/**
 * If the input is not JPEG file with Exif containing orientation information,
 * it returns `undefined`.
 * @param input JPEG file data.
 */
export async function getOrientation(
  input: File | Buffer | ArrayBuffer
): Promise<IOrientationInfo | undefined> {
  const code = await readOrientationCode(input);
  return getOrientationInfo(code);
}

/**
 * @see http://www.cipa.jp/std/documents/j/DC-008-2012_J.pdf
 */
export async function readOrientationCode(
  input: File | Buffer | ArrayBuffer
): Promise<OrientationCode> {
  const view = await prepareDataView(input);
  if (!isValidJpeg(view)) {
    return OrientationCode.unknown;
  }

  const segmentOffset = await findExifSegmentOffset(view);
  if (segmentOffset < 0) {
    return OrientationCode.unknown;
  }

  const { littleEndian, orientationOffset } =
    getOrientationOffsetAndLittleEndian(view, segmentOffset);

  if (orientationOffset < 0) {
    console.warn("Rotation information was not found");
    return OrientationCode.unknown;
  }

  return readOrientationValueAt(view, orientationOffset, littleEndian);
}

export async function updateOrientationCode(
  input: File | Buffer | ArrayBuffer,
  orientation: OrientationCode
): Promise<void> {
  const view = await prepareDataView(input);
  if (!isValidJpeg(view)) {
    throw new Error("The File you are trying to update is not a jpeg");
  }

  const segmentOffset = await findExifSegmentOffset(view);
  if (segmentOffset < 0) {
    throw new Error("The File you are trying to update has no exif data");
  }

  const { littleEndian, orientationOffset } =
    getOrientationOffsetAndLittleEndian(view, segmentOffset);
  setOrientationValueAt(view, orientationOffset, orientation, littleEndian);
}

function getOrientationOffsetAndLittleEndian(
  view: DataView,
  segmentOffset: number
) {
  const tiffHeaderOffset = segmentOffset + TIFF_HEADER_FROM_SEGMENT_OFFSET;
  const littleEndian = isLittleEndian(view, tiffHeaderOffset);
  const ifdPosition = findIfdPosition(view, tiffHeaderOffset, littleEndian);
  const ifdFieldOffset = ifdPosition + IFD_FIELD_COUNT_LENGTH;
  const orientationOffset = findOrientationOffset(
    view,
    ifdFieldOffset,
    littleEndian
  );
  return { littleEndian, orientationOffset };
}

async function prepareDataView(
  input: File | Buffer | ArrayBuffer
): Promise<DataView> {
  // To run on both browser and Node.js,
  // need to check constructors existences before checking instance

  let arrayBuffer;
  if (typeof File !== "undefined" && input instanceof File) {
    arrayBuffer = await readFile(input);
  } else if (typeof Buffer !== "undefined" && input instanceof Buffer) {
    arrayBuffer = input.buffer;
  } else {
    arrayBuffer = input as ArrayBuffer;
  }

  return new DataView(arrayBuffer);
}

async function readFile(file: File) {
  return await new Promise<ArrayBuffer>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(file);
  });
}

function isValidJpeg(view: DataView) {
  return view.byteLength >= 2 && view.getUint16(0, false) === JPEG_HEADER;
}

/**
 * Returns `-1` if not found.
 */
async function findExifSegmentOffset(view: DataView) {
  for await (const segmentPosition of iterateMarkerSegments(view)) {
    if (isExifSegment(view, segmentPosition)) {
      return segmentPosition;
    }
  }

  // not found
  return -1;
}

async function* iterateMarkerSegments(view: DataView) {
  // APPx/Exif p.18, 19, 150
  // - marker (short) `0xffe1` = APP1
  // - length (short) of segment
  // - padding (short) `0x0000` if exif
  // - "EXIF" (char[4]) if exif
  // - content
  // (The doc describe APP1 have to lay next to the SOI,
  //  however, Photoshop renders a JPEG file that SOI is followed by APP0.)

  let segmentPosition = FIRST_MARKER_OFFSET;
  while (true) {
    // just in case
    await sleep(1);

    yield segmentPosition;

    const offsetLength = SEGMENT_LENGTH_OFFSET;
    const length =
      offsetLength + view.getUint16(segmentPosition + offsetLength, false);
    segmentPosition += length;

    if (segmentPosition > view.byteLength) {
      return -1;
    }
  }
}

function isExifSegment(view: DataView, segmentPosition: number) {
  const marker = view.getUint16(segmentPosition + SEGMENT_MARKER_OFFSET, false);
  if (marker !== APP1_MARKER) {
    return false;
  }
  for (let i = 0; i < APP1_EXIF_ID.length; i++) {
    const c = view.getUint8(segmentPosition + SEGMENT_EXIF_ID_OFFSET + i);
    if (c !== APP1_EXIF_ID[i]) {
      return false;
    }
  }
  return true;
}

function isLittleEndian(view: DataView, tiffHeaderOffset: number) {
  const endian = view.getUint16(
    tiffHeaderOffset + TIFF_HEADER_BYTE_ORDER_OFFSET,
    false
  );
  return endian === ORDER_LITTLE_ENDIAN;
}

function findIfdPosition(
  view: DataView,
  tiffHeaderOffset: number,
  littleEndian: boolean | undefined
) {
  // TIFF Header p.17
  // - byte order (short). `0x4949` = little, `0x4d4d` = big
  // - 42 (0x002a) (short)
  // - offset of IFD (long). Minimum is `0x00000008` (8).

  const endianAssertionValue = view.getUint16(
    tiffHeaderOffset + TIFF_HEADER_ENDIAN_ASSERTION_OFFSET,
    littleEndian
  );
  if (endianAssertionValue !== ENDIAN_ASSERTION) {
    throw new Error(
      `Invalid JPEG format: littleEndian ${littleEndian}, assertion: 0x${endianAssertionValue}`
    );
  }

  const ifdDistance = view.getUint32(
    tiffHeaderOffset + TIFF_HEADER_IFD_OFFSET,
    littleEndian
  );

  return tiffHeaderOffset + ifdDistance;
}

function findOrientationOffset(
  view: DataView,
  ifdFieldOffset: number,
  littleEndian: boolean
) {
  const fieldIterator = iterateIfdFields(view, ifdFieldOffset, littleEndian);
  for (const offset of fieldIterator) {
    const tag = view.getUint16(ifdFieldOffset + offset, littleEndian);
    if (tag === ORIENTATION_TAG) {
      return ifdFieldOffset + offset + IFD_VALUE_OFFSET;
    }
  }

  return -1;
}

function* iterateIfdFields(
  view: DataView,
  ifdFieldOffset: number,
  littleEndian: boolean
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

function readOrientationValueAt(
  view: DataView,
  offset: number,
  littleEndian: boolean
) {
  return view.getUint16(offset, littleEndian);
}

function setOrientationValueAt(
  view: DataView,
  offset: number,
  orientation: OrientationCode,
  littleEndian: boolean
) {
  view.setUint16(offset, orientation, littleEndian);
}

/**
 * Converts orientation code specified in Exif to readable information.
 */
export function getOrientationInfo(
  orientation: OrientationCode
): IOrientationInfo | undefined {
  return orientationInfoMap[orientation];
}
