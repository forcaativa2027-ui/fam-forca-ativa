{programs.map((p) => (
  <div key={p.id} className="p-4 rounded-xl border border-gray-200 hover:border-gold transition-colors">
    <div className="flex items-center gap-3">
      <Heart className="shrink-0 h-4 w-4 text-red-500" title="Favoritar" />
      <span className="text-sm font-medium text-navy">{p.title}</span>
    </div>
    <p className="mt-1 text-sm text-muted line-clamp-2">{p.description}</p>
    <div className="mt-2 flex items-center gap-2 text-xs text-muted">
      {p.weekday && <span>{p.weekday}:</span>}
      <span>{p.start_time?.slice(0, 5) || "—"} – {p.end_time?.slice(0, 5) || "—"}</span>
    </div>
    {/* ✅ Botão de Favorito */}
    <button
      onClick={() => toggleFavorite(window.userId!, p.id)}
      className="ml-2 text-sm text-gray-400 hover:text-red-500"
      title={favorites.some((f) => f.program_id === p.id) ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
    >
      ❤
    </button>
  </div>
)}
