export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const STORAGE_KEY = "sinhhai_designs_data";
  const FONTS_STORAGE_KEY = "sinhhai_custom_fonts";

  // Hàm đọc dữ liệu localStorage
  const getStoredData = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [
        {
          id: 1,
          name: "Mẫu thiết kế AI đầu tiên",
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

  const saveStoredData = (data: unknown) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // Giả lập phản hồi cho API Designs
  if (path === "/api/designs" || path.startsWith("/api/designs?")) {
    if (method === "GET") {
      return getStoredData() as T;
    }
    if (method === "POST") {
      const designs = getStoredData();
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
      saveStoredData(designs);
      return newDesign as T;
    }
  }

  const designMatch = path.match(/^\/api\/designs\/(\d+)$/);
  if (designMatch) {
    const id = Number(designMatch[1]);
    let designs = getStoredData();
    
    if (method === "GET") {
      const found = designs.find((d: any) => d.id === id) || designs[0];
      return found as T;
    }
    if (method === "PUT") {
      designs = designs.map((d: any) => {
        if (d.id === id) {
          return {
            ...d,
            ...(body as object),
            updated_at: new Date().toISOString()
          };
        }
        return d;
      });
      saveStoredData(designs);
      return { success: true, ...(body as object) } as T;
    }
    if (method === "DELETE") {
      designs = designs.filter((d: any) => d.id !== id);
      saveStoredData(designs);
      return { success: true } as T;
    }
  }

  if (path === "/api/fonts") {
    if (method === "GET") {
      try {
        const fonts = localStorage.getItem(FONTS_STORAGE_KEY);
        return (fonts ? JSON.parse(fonts) : []) as T;
      } catch {
        return [] as T;
      }
    }
    if (method === "POST") {
      return { family: "Custom-Font", url: "" } as T;
    }
  }

  // Luồng gọi fetch gốc cho các trường hợp khác
  const opts: RequestInit = { method, headers: {} };
  if (body) {
    (opts.headers as Record<string, string>)["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(path, opts);
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Request failed");
  return data as T;
}
