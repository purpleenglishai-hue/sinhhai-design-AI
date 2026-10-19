import { storage } from "./lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const STORAGE_KEY = "sinhhai_firebase_designs";

  const getStoredDesigns = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [
        {
          id: 1,
          name: "Mẫu thiết kế AI trên Sinhhai",
          width: 1080,
          height: 1080,
          canvas_json: JSON.stringify({ version: "6.0.0", objects: [] }),
          thumbnail_url: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    } catch {
      return [];
    }
  };

  const saveStoredDesigns = (data: unknown) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  if (path === "/api/designs" || path.startsWith("/api/designs?")) {
    if (method === "GET") {
      return getStoredDesigns() as T;
    }
    if (method === "POST") {
      const designs = getStoredDesigns();
      const newDesign = {
        id: Date.now(),
        name: (body as any)?.name || "Bản thiết kế mới",
        width: (body as any)?.width || 1080,
        height: (body as any)?.height || 1080,
        canvas_json: JSON.stringify({ version: "6.0.0", objects: [] }),
        thumbnail_url: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      designs.unshift(newDesign);
      saveStoredDesigns(designs);
      return newDesign as T;
    }
  }

  const designMatch = path.match(/^\/api\/designs\/(\d+)$/);
  if (designMatch) {
    const id = Number(designMatch[1]);
    let designs = getStoredDesigns();
    
    if (method === "GET") {
      const found = designs.find((d: any) => d.id === id) || designs[0];
      return found as T;
    }
    if (method === "PUT") {
      designs = designs.map((d: any) => {
        if (d.id === id) {
          return { ...d, ...(body as object), updated_at: new Date().toISOString() };
        }
        return d;
      });
      saveStoredDesigns(designs);
      return { success: true, ...(body as object) } as T;
    }
    if (method === "DELETE") {
      designs = designs.filter((d: any) => d.id !== id);
      saveStoredDesigns(designs);
      return { success: true } as T;
    }
  }

  // Tải tệp lên Firebase Storage khi người dùng upload ảnh hoặc font
  if (path.includes("/api/fonts") || path.includes("/api/upload")) {
    if (method === "POST" && body instanceof FormData) {
      const file = body.get("file") as File;
      if (file) {
        const storageRef = ref(storage, `sinhhai-studio/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return { family: file.name, url: downloadURL } as T;
      }
    }
    if (method === "GET") {
      return [] as T;
    }
  }

  const opts: RequestInit = { method, headers: {} };
  if (body && !(body instanceof FormData)) {
    (opts.headers as Record<string, string>)["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  
  try {
    const r = await fetch(path, opts);
    if (r.ok) return await r.json() as T;
  } catch {
    // Bỏ qua lỗi mạng tĩnh
  }

  return {} as T;
}
