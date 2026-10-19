import { h } from "preact";

export function PhotopeaEditor() {
  return (
    <div class="flex-1 h-full w-full bg-white flex flex-col relative overflow-hidden">
      {/* Thanh trạng thái Studio Sinhhai */}
      <div class="bg-zinc-900 text-white text-xs px-4 py-2 flex justify-between items-center border-b border-zinc-800">
        <span class="font-medium flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Sinhhai Photo Studio Pro (Photopea Core)
        </span>
        <span class="text-zinc-400">Hỗ trợ đầy đủ PSD, Layer, Filter, Smart AI & Export HD</span>
      </div>

      {/* Frame nhúng Photopea trực tiếp */}
      <div class="flex-1 w-full h-full min-h-[500px]">
        <iframe
          src="https://www.photopea.com"
          class="w-full h-full border-0"
          title="Photopea Studio"
          allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; high-precision-timer; microphone; midi; payment; usb; vr; xr-spatial-tracking"
        />
      </div>
    </div>
  );
}
