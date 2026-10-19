import { useState, useCallback, useRef, useEffect } from "preact/hooks";
import type { Design, DesignWithPages, Template, Page } from "../types";
import type { Dimensions } from "../resize";
import { api } from "../api";

export function useDesigns(
  getCanvasJSONForPage: (pageId: string) => string,
  getCanvasSize: () => Dimensions
) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeDesign, setActiveDesign] = useState<Design | null>(null);
  const [loadedDesignId, setLoadedDesignId] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const pagesRef = useRef<Page[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "pending" | "saving" | "error">("saved");
  const [autoSave, setAutoSaveState] = useState(() => {
    try {
      return localStorage.getItem("opendesign:auto-save") === "true";
    } catch {
      return false;
    }
  });
  const activeIdRef = useRef<string | null>(null);
  const activePageIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const designLoadRef = useRef(0);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  const updatePages = useCallback((next: Page[] | ((pages: Page[]) => Page[])) => {
    const updated = typeof next === "function" ? next(pagesRef.current) : next;
    pagesRef.current = updated;
    setPages(updated);
  }, []);

  useEffect(() => {
    activePageIdRef.current = activePageId;
  }, [activePageId]);

  // Load designs + templates từ localStorage / API
  useEffect(() => {
    (async () => {
      try {
        const stored = localStorage.getItem("sinhhai_firebase_designs");
        if (stored) {
          const parsed = JSON.parse(stored);
          setDesigns(parsed);
        } else {
          const d = await api<Design[]>("GET", "/api/designs");
          setDesigns(d);
        }
        setTemplates([]);
      } catch (e) {
        console.error("Failed to load data:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveNow = useCallback(async () => {
    const designId = activeIdRef.current;
    if (!designId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    const { width, height } = getCanvasSize();
    setSaving(true);
    if (activeIdRef.current === designId) setSaveStatus("saving");
    try {
      const currentPages = pagesRef.current;
      const updatedDesigns = designs.map((d) => {
        if (d.id === designId) {
          const firstPage = currentPages.find((p) => p.design_id === designId);
          return {
            ...d,
            width,
            height,
            canvas_json: firstPage ? getCanvasJSONForPage(firstPage.id) || firstPage.canvas_json : d.canvas_json,
            updated_at: new Date().toISOString()
          };
        }
        return d;
      });
      setDesigns(updatedDesigns);
      localStorage.setItem("sinhhai_firebase_designs", JSON.stringify(updatedDesigns));
      if (activeIdRef.current === designId) {
        const updatedActive = updatedDesigns.find(d => d.id === designId);
        if (updatedActive) setActiveDesign(updatedActive);
        setSaveStatus("saved");
      }
    } catch (e) {
      console.error("Failed to save:", e);
      if (activeIdRef.current === designId) setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [getCanvasJSONForPage, getCanvasSize, designs]);

  const saveDesign = useCallback(() => {
    const run = saveQueueRef.current.then(saveNow);
    saveQueueRef.current = run;
    return run;
  }, [saveNow]);

  const createDesign = useCallback(async (): Promise<string | undefined> => {
    try {
      const newId = String(Date.now());
      const d: Design = {
        id: newId,
        name: "Untitled Design",
        width: 1080,
        height: 1080,
        canvas_json: JSON.stringify({ version: "6.0.0", objects: [] }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const updated = [d, ...designs];
      setDesigns(updated);
      localStorage.setItem("sinhhai_firebase_designs", JSON.stringify(updated));
      return d.id;
    } catch (e) {
      console.error("Failed to create design:", e);
    }
  }, [designs]);

  const createFromTemplate = useCallback(async (template: Template): Promise<string | undefined> => {
    try {
      const newId = String(Date.now());
      const d: Design = {
        id: newId,
        name: template.name,
        width: template.width || 1080,
        height: template.height || 1080,
        canvas_json: template.canvas_json || JSON.stringify({ version: "6.0.0", objects: [] }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const updated = [d, ...designs];
      setDesigns(updated);
      localStorage.setItem("sinhhai_firebase_designs", JSON.stringify(updated));
      return d.id;
    } catch (e) {
      console.error("Failed to create from template:", e);
    }
  }, [designs]);

  const loadDesign = useCallback(
    async (id: string) => {
      const request = ++designLoadRef.current;
      try {
        let found = designs.find((d) => d.id === id);
        if (!found) {
          const stored = localStorage.getItem("sinhhai_firebase_designs");
          if (stored) {
            const parsed = JSON.parse(stored);
            found = parsed.find((d: Design) => d.id === id);
          }
        }
        if (!found) {
          found = {
            id,
            name: "Untitled Design",
            width: 1080,
            height: 1080,
            canvas_json: JSON.stringify({ version: "6.0.0", objects: [] }),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        if (request !== designLoadRef.current) return;
        
        const initialPage: Page = {
          id: `page_${id}_1`,
          design_id: id,
          sort_order: 0,
          canvas_json: found.canvas_json || JSON.stringify({ version: "6.0.0", objects: [] })
        };

        updatePages([initialPage]);
        setActiveDesign(found);
        activeIdRef.current = found.id;
        setLoadedDesignId(found.id);
        setActivePageId(initialPage.id);
      } catch (e) {
        console.error("Failed to load design:", e);
      }
    },
    [designs, updatePages]
  );

  const deleteDesign = useCallback(async (id: string) => {
    try {
      const updated = designs.filter((d) => d.id !== id);
      setDesigns(updated);
      localStorage.setItem("sinhhai_firebase_designs", JSON.stringify(updated));
      if (activeIdRef.current === id) {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        setActiveDesign(null);
        activeIdRef.current = null;
        setLoadedDesignId(null);
        updatePages([]);
      }
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  }, [designs, updatePages]);

  const renameDesign = useCallback(async (id: string, name: string) => {
    try {
      const updated = designs.map((d) => (d.id === id ? { ...d, name } : d));
      setDesigns(updated);
      localStorage.setItem("sinhhai_firebase_designs", JSON.stringify(updated));
      if (activeIdRef.current === id) {
        const found = updated.find(d => d.id === id);
        if (found) setActiveDesign(found);
      }
    } catch (e) {
      console.error("Failed to rename:", e);
    }
  }, [designs]);

  // ── Page management ─────────────────────────────────────────────────

  const addPage = useCallback(async (_afterPageId?: string) => {
    if (!activeIdRef.current) return;
    try {
      const newPageId = `page_${activeIdRef.current}_${Date.now()}`;
      const newPage: Page = {
        id: newPageId,
        design_id: activeIdRef.current,
        sort_order: pagesRef.current.length,
        canvas_json: JSON.stringify({ version: "6.0.0", objects: [] })
      };
      updatePages((prev) => [...prev, newPage]);
      setActivePageId(newPageId);
    } catch (e) {
      console.error("Failed to add page:", e);
    }
  }, [updatePages]);

  const duplicatePage = useCallback(
    async (pageId: string) => {
      try {
        const sourcePage = pagesRef.current.find(p => p.id === pageId);
        const currentJson = getCanvasJSONForPage(pageId) || sourcePage?.canvas_json || "{}";
        const newPageId = `page_${activeIdRef.current}_${Date.now()}`;
        const newPage: Page = {
          id: newPageId,
          design_id: activeIdRef.current || "1",
          sort_order: pagesRef.current.length,
          canvas_json: currentJson
        };
        updatePages((prev) => [...prev, newPage]);
        setActivePageId(newPageId);
      } catch (e) {
        console.error("Failed to duplicate page:", e);
      }
    },
    [getCanvasJSONForPage, updatePages]
  );

  const deletePage = useCallback(
    async (pageId: string) => {
      try {
        const remaining = pagesRef.current.filter((p) => p.id !== pageId);
        if (remaining.length === 0) return; // Không xóa hết trang cuối cùng
        updatePages(remaining);
        if (activePageIdRef.current === pageId && remaining.length > 0) {
          setActivePageId(remaining[0].id);
        }
      } catch (e) {
        console.error("Failed to delete page:", e);
      }
    },
    [updatePages]
  );

  const renamePage = useCallback(async (pageId: string, title: string) => {
    try {
      updatePages((prev) => prev.map((p) => (p.id === pageId ? { ...p, title } : p)));
    } catch (e) {
      console.error("Failed to rename page:", e);
    }
  }, [updatePages]);

  const switchToPage = useCallback((pageId: string) => {
    setActivePageId(pageId);
  }, []);

  const activePage = pages.find((p) => p.id === activePageId) ?? null;

  const scheduleSave = useCallback(() => {
    if (!autoSave || !activeIdRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus("pending");
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void saveDesign();
    }, 800);
  }, [autoSave, saveDesign]);

  const setAutoSave = useCallback((enabled: boolean) => {
    try {
      localStorage.setItem("opendesign:auto-save", String(enabled));
    } catch {
      // ignore
    }
    setAutoSaveState(enabled);
    if (!enabled && saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  return {
    designs,
    templates,
    activeDesign,
    loadedDesignId,
    setActiveDesign,
    activeIdRef,
    loading,
    saving,
    saveStatus,
    autoSave,
    setAutoSave,
    createDesign,
    createFromTemplate,
    loadDesign,
    saveDesign,
    deleteDesign,
    renameDesign,
    scheduleSave,
    // Pages
    pages,
    activePageId,
    activePage,
    addPage,
    duplicatePage,
    deletePage,
    renamePage,
    switchToPage,
  };
}
