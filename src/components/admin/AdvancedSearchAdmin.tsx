"use client";
import { useState } from "react";
import { Search, IdCard, ChevronDown, ChevronUp, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/shared/DatePicker";
import { useUsersDirectorySearch, useStates, useDistricts, useSectors, useChurches, useOrgTerminology } from "@/hooks/use-queries";
import { ORG_TERM_DEFAULTS } from "@/services/orgTerminology";

const ROLE_LABELS: Record<string, string> = {
  apostolo: "Apóstolo", pastor: "Pastor", supervisor: "Supervisor",
  lider: "Líder", anfitriao: "Anfitrião", discipulador: "Discipulador", membro: "Membro", visitante: "Visitante",
};
const JOURNEY_LABELS: Record<string, string> = {
  visitante: "Visitante", novo_convertido: "Novo convertido", consolidacao: "Consolidação",
  discipulado: "Discipulado", batismo: "Batismo", membro_ativo: "Membro ativo", membro_efetivo: "Membro efetivo",
  servo: "Servo", lider_formacao: "Líder em formação", lider: "Líder", diacono: "Diácono",
  supervisor: "Supervisor", supervisor_setor: "Supervisor de Setor", supervisor_area: "Supervisor de Área",
  supervisor_distrito: "Supervisor de Distrito", pastor_auxiliar: "Pastor Auxiliar", pastor_principal: "Pastor Principal",
  apostolo: "Apóstolo", missionario: "Missionário",
};
const STATUS_LABELS: Record<string, string> = { ativo: "Ativo", inativo: "Inativo", afastado: "Afastado" };

/**
 * UX-003 Cap. 4 Parte 8 — Pesquisa Corporativa Avançada. Filtros
 * ricos além da busca simples do Ctrl+K.
 */
export function AdvancedSearchAdmin() {
  const [query, setQuery] = useState("");
  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const { data: terms = ORG_TERM_DEFAULTS } = useOrgTerminology();
  const [churchId, setChurchId] = useState("");
  const [role, setRole] = useState("");
  const [journeyStage, setJourneyStage] = useState("");
  const [memberStatus, setMemberStatus] = useState("");
  const [joinedFrom, setJoinedFrom] = useState("");
  const [joinedTo, setJoinedTo] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const { data: states = [] } = useStates();
  const { data: districts = [] } = useDistricts();
  const { data: sectors = [] } = useSectors();
  const { data: churches = [] } = useChurches();

  const hasAnyFilter = !!(query || stateId || districtId || sectorId || churchId || role || journeyStage || memberStatus || joinedFrom || joinedTo);
  const { data: results = [], isLoading } = useUsersDirectorySearch({
    query, stateId, districtId, sectorId, churchId, role, journeyStage, memberStatus, joinedFrom, joinedTo,
  });

  function clearFilters() {
    setQuery(""); setStateId(""); setDistrictId(""); setSectorId(""); setChurchId("");
    setRole(""); setJourneyStage(""); setMemberStatus(""); setJoinedFrom(""); setJoinedTo("");
  }

  function exportCsv() {
    const header = ["Nome", "E-mail", "Telefone", "CEC ID", "Cargo", "Situação", "Status", "Igreja", terms.setor, terms.distrito, "Estado", "Ingresso"];
    const rows = results.map((u) => [
      u.full_name, u.email ?? "", u.phone ?? "", u.cec_id ?? "",
      ROLE_LABELS[u.role] ?? u.role, JOURNEY_LABELS[u.journey_stage ?? ""] ?? "", STATUS_LABELS[u.member_status ?? ""] ?? "",
      u.church_name ?? "", u.sector_name ?? "", u.district_name ?? "", u.state_name ?? "",
      u.joined_at ? new Date(u.joined_at).toLocaleDateString("pt-BR") : "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `pesquisa-avancada-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="font-display text-xl text-navy">Pesquisa Corporativa Avançada</h2>
        <p className="text-sm text-muted-foreground">Filtros ricos por hierarquia, situação ministerial e período — além da busca simples do Ctrl+K.</p>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Nome, e-mail, telefone ou CEC ID…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Select value={stateId} onValueChange={setStateId}>
              <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent><SelectItem value="">Todos os estados</SelectItem>{states.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={churchId} onValueChange={setChurchId}>
              <SelectTrigger><SelectValue placeholder="Igreja" /></SelectTrigger>
              <SelectContent><SelectItem value="">Todas as igrejas</SelectItem>{churches.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue placeholder="Cargo" /></SelectTrigger>
              <SelectContent><SelectItem value="">Todos os cargos</SelectItem>{Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <button type="button" onClick={() => setShowMoreFilters((v) => !v)} className="flex items-center gap-1 text-xs font-semibold text-navy hover:underline">
            {showMoreFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showMoreFilters ? "Menos filtros" : "Mais filtros"}
          </button>

          {showMoreFilters && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Select value={districtId} onValueChange={setDistrictId}>
                <SelectTrigger><SelectValue placeholder={terms.distrito} /></SelectTrigger>
                <SelectContent><SelectItem value="">Todos os distritos</SelectItem>{districts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={sectorId} onValueChange={setSectorId}>
                <SelectTrigger><SelectValue placeholder={terms.setor} /></SelectTrigger>
                <SelectContent><SelectItem value="">Todos os setores</SelectItem>{sectors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={journeyStage} onValueChange={setJourneyStage}>
                <SelectTrigger><SelectValue placeholder="Situação ministerial" /></SelectTrigger>
                <SelectContent><SelectItem value="">Todas</SelectItem>{Object.entries(JOURNEY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={memberStatus} onValueChange={setMemberStatus}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent><SelectItem value="">Todos</SelectItem>{Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <div>
                <label className="text-xs text-muted-foreground">Ingresso de</label>
                <DatePicker value={joinedFrom} onChange={setJoinedFrom} placeholder="A partir de" disableFuture />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Ingresso até</label>
                <DatePicker value={joinedTo} onChange={setJoinedTo} placeholder="Até" disableFuture />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={clearFilters} disabled={!hasAnyFilter}>Limpar filtros</Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={results.length === 0} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && <p className="text-sm text-muted-foreground">Buscando…</p>}

      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground">{results.length} resultado(s)</p>
        {results.map((u) => (
          <div key={u.profile_id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
            {u.photo_url ? (
              <img src={u.photo_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy/10 text-navy"><IdCard className="h-4 w-4" /></div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-navy">{u.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {ROLE_LABELS[u.role] ?? u.role}
                {u.journey_stage ? ` · ${JOURNEY_LABELS[u.journey_stage] ?? u.journey_stage}` : ""}
                {u.church_name ? ` · ${u.church_name}` : ""}
                {u.sector_name ? ` · Setor ${u.sector_name}` : ""}
              </p>
            </div>
            {u.member_status && (
              <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{STATUS_LABELS[u.member_status]}</span>
            )}
          </div>
        ))}
        {!isLoading && results.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {hasAnyFilter ? "Nenhum resultado encontrado com esses filtros." : "Escolha ao menos um filtro ou digite algo pra buscar."}
          </p>
        )}
      </div>
    </div>
  );
}
