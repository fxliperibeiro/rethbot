import Ffmpeg, { FfmpegCommand, FfmpegCommandOptions } from 'fluent-ffmpeg';
import { Writable } from 'stream';

type FFmpegArgs = {
  options: FfmpegCommandOptions;
  command?: (command: FfmpegCommand) => FfmpegCommand | Writable;
};

export async function ffmpeg({ options, command }: FFmpegArgs): Promise<void> {
  return new Promise(async (resolve, reject) => {

    let ffmpegCommand = Ffmpeg(options);

    if (command) {
      ffmpegCommand = command(ffmpegCommand) as FfmpegCommand;
    }

    ffmpegCommand.on('end', () => {
      return resolve()
    }).on('error', (err) => reject(err));
  });
}