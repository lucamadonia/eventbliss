import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { clearGameContentCache } from './useGameContentCached';

export interface GameContent {
  id: string;
  game_id: string;
  content_type: string;
  content: Record<string, any>;
  difficulty: string;
  category: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const db = supabase as any;

export function useGameContent() {
  const [items, setItems] = useState<GameContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchItems = useCallback(async (gameId?: string, contentType?: string, search?: string, page = 0, limit = 20) => {
    setLoading(true);
    try {
      let query = db.from('game_content').select('*', { count: 'exact' });
      if (gameId) query = query.eq('game_id', gameId);
      if (contentType) query = query.eq('content_type', contentType);
      if (search) query = query.ilike('content', `%${search}%`);
      query = query.order('created_at', { ascending: false }).range(page * limit, (page + 1) * limit - 1);
      const { data, count } = await query;
      setItems((data as GameContent[]) || []);
      setTotal(count || 0);
    } catch (e) { console.warn('Failed to fetch game content:', e); }
    setLoading(false);
  }, []);

  const addItem = useCallback(async (item: Omit<GameContent, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await db.from('game_content').insert({ ...item, created_by: user?.id }).select().single();
      if (error) throw error;
      setItems(prev => [data as GameContent, ...prev]);
      clearGameContentCache();
      return data as GameContent;
    } catch (e) { console.error('Failed to add:', e); return null; }
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<GameContent>) => {
    try {
      const { data, error } = await db.from('game_content').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      setItems(prev => prev.map(i => i.id === id ? (data as GameContent) : i));
      clearGameContentCache();
      return data as GameContent;
    } catch (e) { console.error('Failed to update:', e); return null; }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    try {
      await db.from('game_content').delete().eq('id', id);
      setItems(prev => prev.filter(i => i.id !== id));
      clearGameContentCache();
    } catch (e) { console.error('Failed to delete:', e); }
  }, []);

  const getStats = useCallback(async () => {
    try {
      const { data } = await db.from('game_content').select('game_id, content_type');
      const games = new Set((data || []).map((d: any) => d.game_id));
      return { total: data?.length || 0, games: games.size };
    } catch { return { total: 0, games: 0 }; }
  }, []);

  return { items, loading, total, fetchItems, addItem, updateItem, deleteItem, getStats };
}
