

export abstract class VideoProcessorPort {
  abstract processVideo(file_path: string): Promise<string>;
}
