declare module 'node-webpmux' {
  type WebPType = 0 | 1 | 2;

  interface FrameData {
    type: WebPType;
    vp8?: Buffer;
    vp8l?: Buffer;
    alph?: Buffer;
    width: number;
    height: number;
  }

  interface ImageData {
    type: WebPType;
    vp8?: Buffer;
    vp8l?: Buffer;
    extended?: {
      hasICCP?: boolean;
      hasAlpha?: boolean;
      hasEXIF?: boolean;
      hasXMP?: boolean;
      width: number;
      height: number;
    };
    anim?: {
      bgColor: number[];
      loops: number;
      frames: FrameData[];
    };
  }

  class Image {
    constructor();
    static initLib(): Promise<void>;
    load(d: string | Buffer): Promise<void>;
    convertToAnim(): void;
    demux(options?: {
      path?: string;
      buffers?: boolean;
      frame?: number;
      prefix?: string;
      start?: number;
      end?: number;
    }): Promise<Buffer[]>;

    replaceFrame(frameIndex: number, d: string | Buffer): Promise<void>;
    save(
      path: string | null,
      options?: {
        width?: number;
        height?: number;
        frames?: FrameData[];
        bgColor?: number[];
        loops?: number;
        delay?: number;
        x?: number;
        y?: number;
        blend?: boolean;
        dispose?: boolean;
        exif?: boolean;
        iccp?: boolean;
        xmp?: boolean;
      },
    ): Promise<Buffer>;

    getImageData(): Promise<Buffer>;
    setImageData(
      buf: Buffer,
      options?: {
        width?: number;
        height?: number;
        preset?: number;
        quality?: number;
        exact?: boolean;
        lossless?: number;
        method?: number;
        advanced?: Buffer;
      },
    ): Promise<number>;

    getFrameData(frameIndex: number): Promise<Buffer>;
    setFrameData(
      frameIndex: number,
      buf: Buffer,
      options?: {
        width?: number;
        height?: number;
        preset?: number;
        quality?: number;
        exact?: boolean;
        lossless?: number;
        method?: number;
        advanced?: Buffer;
      },
    ): Promise<number>;

    readonly data: ImageData | null;
    readonly loaded: boolean;
    readonly path: string;
    readonly width: number | undefined;
    readonly height: number | undefined;
    readonly type: WebPType | undefined;
    readonly hasAnim: boolean;
    readonly hasAlpha: boolean;
    readonly anim:
      | {
          bgColor: number[];
          loops: number;
          frames: FrameData[];
        }
      | undefined;

    readonly frames: FrameData[] | undefined;
    exif: Buffer | undefined;
    iccp: Buffer | undefined;
    xmp: Buffer | undefined;

    // Private member functions (not accessible)
    _convertToExtended(): void;
    _demuxFrame(d: string | null, frame: FrameData): Promise<Buffer>;
    _save(
      writer: any, // This type should be the actual writer type, but it's not provided in the code snippet
      options: {
        width?: number;
        height?: number;
        frames?: FrameData[];
        bgColor?: number[];
        loops?: number;
        delay?: number;
        x?: number;
        y?: number;
        blend?: boolean;
        dispose?: boolean;
        exif?: boolean;
        iccp?: boolean;
        xmp?: boolean;
      },
    ): Promise<void>;

    // Static member functions
    static save(
      d: string | null,
      options: {
        width?: number;
        height?: number;
        frames?: FrameData[];
        bgColor?: number[];
        loops?: number;
        delay?: number;
        x?: number;
        y?: number;
        blend?: boolean;
        dispose?: boolean;
        exif?: boolean;
        iccp?: boolean;
        xmp?: boolean;
      },
    ): Promise<void>;

    static getEmptyImage(ext: boolean): Promise<Image>;
    static generateFrame(options: {
      path?: string;
      buffer?: Buffer;
      img?: Image;
      x?: number;
      y?: number;
      delay?: number;
      blend?: boolean;
      dispose?: boolean;
    }): Promise<FrameData>;

    static from(webp: Image): Image;
  }

  const TYPE_LOSSY: 0;
  const TYPE_LOSSLESS: 1;
  const TYPE_EXTENDED: 2;

  const encodeResults: {
    LIB_NOT_READY: -1;
    LIB_INVALID_CONFIG: -2;
    SUCCESS: 0;
    VP8_ENC_ERROR_OUT_OF_MEMORY: 1;
    VP8_ENC_ERROR_BITSTREAM_OUT_OF_MEMORY: 2;
    VP8_ENC_ERROR_NULL_PARAMETER: 3;
    VP8_ENC_ERROR_INVALID_CONFIGURATION: 4;
    VP8_ENC_ERROR_BAD_DIMENSION: 5;
    VP8_ENC_ERROR_PARTITION0_OVERFLOW: 6;
    VP8_ENC_ERROR_PARTITION_OVERFLOW: 7;
    VP8_ENC_ERROR_BAD_WRITE: 8;
    VP8_ENC_ERROR_FILE_TOO_BIG: 9;
    VP8_ENC_ERROR_USER_ABORT: 10;
    VP8_ENC_ERROR_LAST: 11;
  };

  const hints: {
    DEFAULT: 0;
    PICTURE: 1;
    PHOTO: 2;
    GRAPH: 3;
  };

  const presets: {
    DEFAULT: 0;
    PICTURE: 1;
    PHOTO: 2;
    DRAWING: 3;
    ICON: 4;
    TEXT: 5;
  };

  export {
    Image,
    TYPE_LOSSY,
    TYPE_LOSSLESS,
    TYPE_EXTENDED,
    encodeResults,
    hints,
    presets,
  };
}
