/** ffprobe-static tip bildirimi getirmiyor; ihtiyacimiz olan tek alan bu. */
declare module "ffprobe-static" {
  const ffprobe: { path: string };
  export default ffprobe;
}
