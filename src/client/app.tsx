// Mock API implementation using localStorage for static hosting (Cloudflare Pages)

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const STORAGE_KEY_DESIGNS = "sinhhai_designs";
  const STORAGE_KEY_TEMPLATES = "sinhhai_templates";
  const STORAGE_KEY_FONTS = "sinhhai_fonts";
  const STORAGE_KEY_BRANDS = "sinhhai_brands";

  // Khởi tạo dữ liệu mẫu nếu chưa có
  if (!localStorage.getItem(STORAGE_KEY_TEMPLATES)) {
    const defaultTemplates = [
      {
        id: "1",
        name: "Social Media Post",
        category: "Social",
        width: 1080,
        height: 1080,
        canvas_json: JSON.stringify({ version: "6.0.0", objects: [] }),
        thumbnail_url: "",
        sort_order: 1
      }
    ];
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(defaultTemplates));
  }

  if (!localStorage.getItem(STORAGE_KEY_DESIGNS)) {
    localStorage.setItem(STORAGE_KEY_DESIGNS, JSON.stringify([]));
  }

  // Xử lý các endpoint GET
  if (method === "GET") {
    if (path === "/api/designs" || path.startsWith("/api/designs?")) {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY_DESIGNS) || "[]");
      return data as unknown as T;
    }
    if (path === "/api/templates" || path.startsWith("/api/templates?")) {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY_TEMPLATES) || "[]");
      return data as unknown as T;
    }
    if (path === "/api/fonts") {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY_FONTS) || "[]");
      return data as unknown as T;
    }
    if (path === "/api/brand-kits") {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY_BRANDS) || "[]");
      return data as unknown as T;
    }
    if (path.match(/^\/api\/designs\/[^/]+$/)) {
      const id = path.split("/")[3];
      const designs = JSON.parse(localStorage.getItem(STORAGE_KEY_DESIGNS) || "[]");
      const design = designs.find((d: any) => d.id === id);
      if (!design) {
        throw new Error("Design not found");
      }
      return design as unknown as T;
    }
    if (path.match(/^\/api\/designs\/[^/]+\/fields$/)) {
      return [] as unknown as T;
    }
  }

  // Xử lý các endpoint POST
  if (method === "POST") {
    if (path === "/api/designs") {
      const designs = JSON.parse(localStorage.getItem(STORAGE_KEY_DESIGNS) || "[]");
      const payload = body as any;
      const newDesign = {
        id: "d_" + Math.random().toString(36.substring(2, 9)),
        name: payload.name || "Untitled Design",
        width: payload.width || 1080,
        height: payload.height || 1080,
        canvas_json: payload.canvas_json || JSON.stringify({ version: "6.0.0", objects: [] }),
        thumbnail_url: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pages: [{ id: "p_1", canvas_json: JSON.stringify({ version: "6.0.0", objects: [] }) }]
      };
      designs.unshift(newDesign);
      localStorage.setItem(STORAGE_KEY_DESIGNS, JSON.stringify(designs));
      return newDesign as unknown as T;
    }
    if (path.startsWith("/api/designs/") && path.endsWith("/fill")) {
      const id = path.split("/")[3];
      const designs = JSON.parse(localStorage.getItem(STORAGE_KEY_DESIGNS) || "[]");
      const design = designs.find((d: any) => d.id === id);
      return design as unknown as T;
    }
  }

  // Xử lý các endpoint PUT
  if (method === "PUT" && path.match(/^\/api\/designs\/[^/]+$/)) {
    const id = path.split("/")[3];
    const designs = JSON.parse(localStorage.getItem(STORAGE_KEY_DESIGNS) || "[]");
    const index = designs.findIndex((d: any) => d.id === id);
    if (index !== -1) {
      const payload = body as any;
      designs[index] = {
        ...designs[index],
        ...payload,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY_DESIGNS, JSON.stringify(designs));
      return designs[index] as unknown as T;
    }
  }

  // Xử lý các endpoint DELETE
  if (method === "DELETE" && path.match(/^\/api\/designs\/[^/]+$/)) {
    const id = path.split("/")[3];
    let designs = JSON.parse(localStorage.getItem(STORAGE_KEY_DESIGNS) || "[]");
    designs = designs.filter((d: any) => d.id !== id);
    localStorage.setItem(STORAGE_KEY_DESIGNS, JSON.stringify(designs));
    return { success: true } as unknown as T;
  }

  return {} as unknown as T;
}
