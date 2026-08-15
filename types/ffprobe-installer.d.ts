/** @ffprobe-installer/ffprobe tip bildirimi getirmiyor; gereken tek alan bu. */
declare module "@ffprobe-installer/ffprobe" {
  const ffprobe: { path: string; version: string };
  export default ffprobe;
}
