import { Toolbar } from "./toolbar";
import { PhotopeaEditor } from "./PhotopeaEditor";

export function Editor() {
  return (
    <div class="flex flex-col h-screen w-screen overflow-hidden bg-zinc-900">
      {/* Thanh công cụ tiêu đề phía trên */}
      <Toolbar />
      
      {/* Vùng không gian làm việc chính nhúng Photopea Studio Pro */}
      <div class="flex-1 flex min-h-0 w-full h-full relative">
        <PhotopeaEditor />
      </div>
    </div>
  );
}
