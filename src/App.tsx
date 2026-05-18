/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ListFilter, Trash2, ListOrdered, ChevronDown, LogOut, User } from 'lucide-react';
import { GroceryItem, SortOption } from './types';
import Header from './components/Header';
import GroceryForm from './components/GroceryForm';
import GroceryListItem from './components/GroceryListItem';
import Auth from './components/Auth';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

const STORAGE_KEY = 'freshcart_grocery_list';
const HISTORY_KEY = 'freshcart_history';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);

  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('incomplete_first');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isBacklogExpanded, setIsBacklogExpanded] = useState(true);

  // Sync local history to localStorage
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Items and Setup Realtime
  useEffect(() => {
    if (!session) return;

    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('grocery_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching items:', error);
      } else {
        setItems(data || []);
      }
    };

    fetchItems();

    // Subscribe to changes
    const channel = supabase
      .channel('grocery_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grocery_items' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setItems(prev => [payload.new as GroceryItem, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setItems(prev => prev.map(item => item.id === payload.new.id ? payload.new as GroceryItem : item));
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const addItem = async (newItemData: Omit<GroceryItem, 'id' | 'created_at' | 'is_completed' | 'is_archived'>) => {
    const newItem = {
      name: newItemData.name,
      note: newItemData.note,
      quantity: newItemData.quantity,
      is_completed: false,
      is_archived: false,
      created_at: Date.now(),
      user_id: session?.user.id
    };

    const { error } = await supabase.from('grocery_items').insert([newItem]);
    if (error) console.error('Error adding item:', error);

    // Add to LOCAL history if unique
    if (!history.some(h => h.toLowerCase() === newItemData.name.toLowerCase())) {
      setHistory(prev => [newItemData.name, ...prev].slice(0, 50));
    }
  };

  const removeFromHistory = (name: string) => {
    setHistory(prev => prev.filter(h => h.toLowerCase() !== name.toLowerCase()));
  };

  const updateItem = async (updatedItem: GroceryItem) => {
    const { error } = await supabase
      .from('grocery_items')
      .update({
        name: updatedItem.name,
        note: updatedItem.note,
        quantity: updatedItem.quantity
      })
      .eq('id', updatedItem.id);
    
    if (error) console.error('Error updating item:', error);
    setEditingItem(null);
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('grocery_items').delete().eq('id', id);
    if (error) console.error('Error deleting item:', error);
    if (editingItem?.id === id) setEditingItem(null);
  };

  const toggleItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const nextIsCompleted = !item.is_completed;
    const { error } = await supabase
      .from('grocery_items')
      .update({
        is_completed: nextIsCompleted,
        is_archived: nextIsCompleted ? item.is_archived : false
      })
      .eq('id', id);
    
    if (error) console.error('Error toggling item:', error);
  };

  const archiveCompleted = async () => {
    const toArchive = items.filter(i => i.is_completed && !i.is_archived).map(i => i.id);
    if (toArchive.length === 0) return;

    const { error } = await supabase
      .from('grocery_items')
      .update({ is_archived: true })
      .in('id', toArchive);
    
    if (error) console.error('Error archiving items:', error);
  };

  const clearCompleted = async () => {
    const toDelete = items.filter(i => i.is_archived).map(i => i.id);
    if (toDelete.length === 0) return;

    const { error } = await supabase.from('grocery_items').delete().in('id', toDelete);
    if (error) console.error('Error clearing completed:', error);
  };

  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  const sortedItems = useMemo(() => {
    const result = [...items];
    switch (sortBy) {
      case 'newest':
        return result.sort((a, b) => b.created_at - a.created_at);
      case 'oldest':
        return result.sort((a, b) => a.created_at - b.created_at);
      case 'alphabetical':
        return result.sort((a, b) => a.name.localeCompare(b.name));
      case 'incomplete_first':
        return result.sort((a, b) => {
          if (a.is_completed === b.is_completed) return b.created_at - a.created_at;
          return a.is_completed ? 1 : -1;
        });
      default:
        return result;
    }
  }, [items, sortBy]);

  const pendingItems = useMemo(() => sortedItems.filter(item => !item.is_archived), [sortedItems]);
  const completedItems = useMemo(() => sortedItems.filter(item => item.is_archived), [sortedItems]);
  const readyToArchiveCount = useMemo(() => pendingItems.filter(i => i.is_completed).length, [pendingItems]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen pb-20 max-w-lg mx-auto">
      <div className="flex justify-end p-4">
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 pl-2">
            <User size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 truncate max-w-[120px]">
              {session.user.email}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
      
      <Header />

      <main className="px-4">
        <GroceryForm
          onAdd={addItem}
          editingItem={editingItem}
          onUpdate={updateItem}
          onCancelEdit={() => setEditingItem(null)}
          history={history}
          onRemoveFromHistory={removeFromHistory}
        />

        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <button
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-black transition-colors"
            >
              <ListFilter size={16} />
              <span>Sort by: {sortBy.replace('_', ' ')}</span>
              <ChevronDown size={14} className={`transition-transform ${isFilterMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isFilterMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsFilterMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20"
                  >
                    {[
                      { id: 'incomplete_first', label: 'Priority (Pending First)' },
                      { id: 'newest', label: 'Date (Newest)' },
                      { id: 'oldest', label: 'Date (Oldest)' },
                      { id: 'alphabetical', label: 'Name (A-Z)' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSortBy(option.id as SortOption);
                          setIsFilterMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          sortBy === option.id ? 'text-black font-semibold' : 'text-gray-500'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {readyToArchiveCount > 0 && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={archiveCompleted}
                className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                <span>Completed</span>
                <div className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                  {readyToArchiveCount}
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {pendingItems.length > 0 ? (
              pendingItems.map((item) => (
                <GroceryListItem
                  key={item.id}
                  item={item}
                  onToggle={toggleItem}
                  onDelete={deleteItem}
                  onEdit={(item) => {
                    setEditingItem(item);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))
            ) : items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-4">
                  <ListOrdered size={32} />
                </div>
                <h3 className="text-gray-900 font-medium tracking-tight">Your list is empty</h3>
                <p className="text-gray-400 text-sm mt-1">Start adding items to stay organized.</p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {completedItems.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                <button
                  onClick={() => setIsBacklogExpanded(!isBacklogExpanded)}
                  className="flex items-center gap-2 group"
                >
                  <div className="bg-gray-100 text-gray-400 p-1.5 rounded-lg group-hover:bg-black group-hover:text-white transition-all">
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isBacklogExpanded ? '' : '-rotate-90'}`} />
                  </div>
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    Completed ({completedItems.length})
                  </h2>
                </button>

                <button
                  onClick={clearCompleted}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                >
                  <Trash2 size={14} />
                  <span>Clear All</span>
                </button>
              </div>

              <AnimatePresence mode="popLayout">
                {isBacklogExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-3 overflow-hidden"
                  >
                    {completedItems.map((item) => (
                      <GroceryListItem
                        key={item.id}
                        item={item}
                        onToggle={toggleItem}
                        onDelete={deleteItem}
                        onEdit={(item) => {
                          setEditingItem(item);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Mobile progress summary */}
      {items.length > 0 && (
        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 lg:hidden">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Progress</span>
              <span className="text-sm font-semibold">
                {items.filter(i => i.is_completed).length} of {items.length} items bought
              </span>
            </div>
            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(items.filter(i => i.is_completed).length / items.length) * 100}%` }}
                className="h-full bg-black"
              />
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
