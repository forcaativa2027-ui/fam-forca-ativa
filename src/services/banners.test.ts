import { describe, expect, it, vi } from "vitest";
import {
  createBanner,
  deleteBanner,
  listActiveBanners,
  listAllBanners,
  updateBanner,
} from "./banners";

function chain(result: { data?: unknown; error?: unknown }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "in", "order", "insert", "update", "delete", "single"]) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }
  builder["then"] = vi.fn();
  Object.defineProperty(builder, "then", {
    value: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  });
  return builder;
}

describe("banners — isolamento do tenant FAM", () => {
  it("consulta banners ativos com tenant FAM e falha fechada", async () => {
    const first = chain({ data: null, error: { message: "column missing" } });
    const sb = { from: vi.fn().mockReturnValue(first) } as any;

    await expect(listActiveBanners(sb)).resolves.toEqual([]);
    expect(sb.from).toHaveBeenCalledTimes(1);
    expect(first.eq).toHaveBeenCalledWith("tenant_key", "FAM");
    expect(first.eq).toHaveBeenCalledWith("is_active", true);
    expect(first.in).toHaveBeenCalledWith("workflow_status", ["publicado", "agendado"]);
  });

  it("não retorna registros nulos ou de outro tenant", async () => {
    const first = chain({
      data: [
        { id: "fam", tenant_key: "FAM", is_active: true, workflow_status: "publicado", audience: "publico_geral", starts_at: null, ends_at: null },
        { id: "cec", tenant_key: "CEC", is_active: true, workflow_status: "publicado", audience: "publico_geral", starts_at: null, ends_at: null },
        { id: "null", tenant_key: null, is_active: true, workflow_status: "publicado", audience: "publico_geral", starts_at: null, ends_at: null },
      ],
      error: null,
    });
    const sb = { from: vi.fn().mockReturnValue(first) } as any;

    await expect(listActiveBanners(sb)).resolves.toEqual([
      expect.objectContaining({ id: "fam" }),
    ]);
  });

  it("não faz consulta ampla quando a listagem administrativa falha", async () => {
    const first = chain({ data: null, error: { message: "RLS" } });
    const sb = { from: vi.fn().mockReturnValue(first) } as any;

    await expect(listAllBanners(sb)).rejects.toEqual({ message: "RLS" });
    expect(sb.from).toHaveBeenCalledTimes(1);
  });

  it("impõe FAM na criação e ignora tenant enviado pelo formulário", async () => {
    const first = chain({ data: { id: "1", tenant_key: "FAM" }, error: null });
    const sb = { from: vi.fn().mockReturnValue(first) } as any;

    await createBanner(sb, { title: "Banner", tenant_key: "CEC" } as any);
    expect(first.insert).toHaveBeenCalledWith({ title: "Banner", tenant_key: "FAM" });
  });

  it("escopa update e delete por id e tenant FAM", async () => {
    const updateChain = chain({ data: null, error: null });
    const deleteChain = chain({ data: null, error: null });
    const sb = { from: vi.fn().mockReturnValueOnce(updateChain).mockReturnValueOnce(deleteChain) } as any;

    await updateBanner(sb, "1", { title: "Novo", tenant_key: "CEC" } as any);
    await deleteBanner(sb, "1");

    expect(updateChain.eq).toHaveBeenCalledWith("id", "1");
    expect(updateChain.eq).toHaveBeenCalledWith("tenant_key", "FAM");
    expect(updateChain.update).toHaveBeenCalledWith({ title: "Novo" });
    expect(deleteChain.eq).toHaveBeenCalledWith("id", "1");
    expect(deleteChain.eq).toHaveBeenCalledWith("tenant_key", "FAM");
  });
});
