import { useState, useEffect, useCallback, useMemo } from 'react';
import { StickyNote, Plus, Search, Star, Tag, Target, X, Calendar } from 'lucide-react';

type NoteCategory = 'aprendizado' | 'ideia' | 'reflexão' | 'erro' | 'insight';

interface Note {
  id: string;
  content: string;
  category?: NoteCategory;
  linkedMetaId?: string;
  linkedMissionId?: string;
  favorited: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'lifequest_notes';
const CATEGORIES: { value: NoteCategory; label: string; icon: string }[] = [
  { value: 'aprendizado', label: 'Aprendizado', icon: '📚' },
  { value: 'ideia', label: 'Ideia', icon: '💡' },
  { value: 'reflexão', label: 'Reflexão', icon: '🪞' },
  { value: 'erro', label: 'Erro', icon: '❌' },
  { value: 'insight', label: 'Insight', icon: '⚡' },
];

function generateId() { return Math.random().toString(36).substring(2, 15); }

function loadNotes(): Note[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

export function NotesPanel() {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory | undefined>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | NoteCategory>('all');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const addNote = useCallback(() => {
    if (!content.trim()) return;
    const note: Note = {
      id: generateId(),
      content: content.trim(),
      category,
      favorited: false,
      createdAt: new Date().toISOString(),
    };
    setNotes(prev => [note, ...prev]);
    setContent('');
    setCategory(undefined);
    setShowForm(false);
  }, [content, category]);

  const toggleFavorite = useCallback((id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, favorited: !n.favorited } : n));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (filter === 'favorites') result = result.filter(n => n.favorited);
    else if (filter !== 'all') result = result.filter(n => n.category === filter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(n => n.content.toLowerCase().includes(q));
    }
    return result;
  }, [notes, filter, search]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Note[]> = {};
    filteredNotes.forEach(note => {
      const date = new Date(note.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(note);
    });
    return groups;
  }, [filteredNotes]);

  return (
    <div className="space-y-4">
      {/* Quick create */}
      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          className="w-full section-card flex items-center gap-3 text-left hover:border-primary/30 transition-all group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-body font-semibold text-foreground">Nova anotação</p>
            <p className="text-xs text-muted-foreground font-body">Registre um pensamento, ideia ou aprendizado</p>
          </div>
        </button>
      ) : (
        <div className="section-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xs tracking-wider text-foreground">Nova Anotação</h3>
            <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Escreva livremente..."
            rows={4}
            autoFocus
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />

          {/* Optional category */}
          <div>
            <p className="text-[10px] font-display tracking-wider text-muted-foreground mb-2 uppercase">Categoria (opcional)</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button key={cat.value}
                  onClick={() => setCategory(category === cat.value ? undefined : cat.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-body transition-all ${
                    category === cat.value
                      ? 'bg-primary/15 text-primary border border-primary/25'
                      : 'bg-secondary/50 text-muted-foreground border border-border hover:text-foreground'
                  }`}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={addNote} disabled={!content.trim()}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-wider hover:opacity-90 transition-all disabled:opacity-40">
            Salvar
          </button>
        </div>
      )}

      {/* Search & filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar anotações..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[
            { value: 'all' as const, label: 'Todas' },
            { value: 'favorites' as const, label: '⭐ Favoritas' },
            ...CATEGORIES.map(c => ({ value: c.value as typeof filter, label: `${c.icon} ${c.label}` })),
          ].map(f => (
            <button key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-body whitespace-nowrap transition-all ${
                filter === f.value
                  ? 'bg-primary/15 text-primary border border-primary/25'
                  : 'bg-secondary/40 text-muted-foreground border border-border/50 hover:text-foreground'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes list grouped by date */}
      {filteredNotes.length === 0 ? (
        <div className="section-card text-center py-10">
          <StickyNote className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-body">
            {search ? 'Nenhuma anotação encontrada' : 'Nenhuma anotação ainda'}
          </p>
          <p className="text-xs text-muted-foreground/60 font-body mt-1">
            Comece registrando um pensamento ou aprendizado
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(groupedByDate).map(([date, dateNotes]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-display tracking-wider text-muted-foreground uppercase">{date}</span>
              </div>
              <div className="space-y-2">
                {dateNotes.map(note => {
                  const catInfo = CATEGORIES.find(c => c.value === note.category);
                  return (
                    <div key={note.id} className={`section-card group ${note.favorited ? 'border-primary/20 bg-primary/3' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-body text-foreground whitespace-pre-wrap leading-relaxed">{note.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {catInfo && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-body">
                                {catInfo.icon} {catInfo.label}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground/60 font-body">
                              {new Date(note.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => toggleFavorite(note.id)}
                            className={`p-1.5 rounded-lg hover:bg-secondary ${note.favorited ? 'text-game-gold' : 'text-muted-foreground'}`}>
                            <Star className={`w-3.5 h-3.5 ${note.favorited ? 'fill-game-gold' : ''}`} />
                          </button>
                          <button onClick={() => deleteNote(note.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {notes.length > 0 && (
        <div className="section-card">
          <h3 className="font-display text-[10px] tracking-[0.25em] text-muted-foreground mb-3 uppercase">Estatísticas</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-display text-lg font-bold text-foreground">{notes.length}</p>
              <p className="text-[10px] text-muted-foreground font-body">Total</p>
            </div>
            <div>
              <p className="font-display text-lg font-bold text-game-gold">{notes.filter(n => n.favorited).length}</p>
              <p className="text-[10px] text-muted-foreground font-body">Favoritas</p>
            </div>
            <div>
              <p className="font-display text-lg font-bold text-primary">
                {new Set(notes.map(n => n.createdAt.split('T')[0])).size}
              </p>
              <p className="text-[10px] text-muted-foreground font-body">Dias</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
