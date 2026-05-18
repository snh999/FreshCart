/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plus, X, Minus, PlusCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { GroceryItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface GroceryFormProps {
  onAdd: (item: Omit<GroceryItem, 'id' | 'created_at' | 'is_completed' | 'is_archived'>) => void;
  editingItem?: GroceryItem | null;
  onUpdate?: (item: GroceryItem) => void;
  onCancelEdit?: () => void;
  history?: string[];
  onRemoveFromHistory?: (name: string) => void;
}

export default function GroceryForm({ onAdd, editingItem, onUpdate, onCancelEdit, history = [], onRemoveFromHistory }: GroceryFormProps) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = history.filter(
    h => h.toLowerCase().includes(name.toLowerCase()) && h.toLowerCase() !== name.toLowerCase()
  ).slice(0, 5);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setNote(editingItem.note || '');
      setQuantity(editingItem.quantity);
      setShowSuggestions(false);
    } else {
      resetForm();
    }
  }, [editingItem]);

  const resetForm = () => {
    setName('');
    setNote('');
    setQuantity(1);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingItem && onUpdate) {
      onUpdate({
        ...editingItem,
        name: name.trim(),
        note: note.trim() || undefined,
        quantity,
      });
    } else {
      onAdd({
        name: name.trim(),
        note: note.trim() || undefined,
        quantity,
      });
      resetForm();
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setName(suggestion);
    setShowSuggestions(false);
  };

  return (
    <motion.div
      layout
      className={`bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8 ${
        editingItem ? 'ring-2 ring-black bg-gray-50' : ''
      }`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h2>
          {editingItem && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-gray-400 hover:text-black transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1 relative">
          <label htmlFor="name" className="text-xs font-medium text-gray-500 ml-1">Item Name</label>
          <input
            id="name"
            autoFocus
            type="text"
            placeholder="e.g. Organic Milk"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            autoComplete="off"
            className="bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-gray-300"
          />

          <AnimatePresence>
            {showSuggestions && name.length > 0 && filteredSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
              >
                {filteredSuggestions.map((suggestion) => (
                  <div
                    key={suggestion}
                    className="flex items-center justify-between group hover:bg-gray-50 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => selectSuggestion(suggestion)}
                      className="flex-1 text-left px-4 py-3 text-sm font-medium"
                    >
                      {suggestion}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFromHistory?.(suggestion);
                      }}
                      className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                      title="Remove from history"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Backdrop to close suggestions */}
          {showSuggestions && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowSuggestions(false)}
            />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="note" className="text-xs font-medium text-gray-500 ml-1">Note (Optional)</label>
          <input
            id="note"
            type="text"
            placeholder="e.g. Full cream, 2L"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-gray-300"
          />
        </div>

        <div className="flex items-center justify-between gap-4 mt-2">
          <div className="flex items-center bg-gray-50 rounded-xl px-2 py-1">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 text-gray-400 hover:text-black transition-colors"
            >
              <Minus size={18} />
            </button>
            <span className="w-8 text-center font-medium tabular-nums">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 text-gray-400 hover:text-black transition-colors"
            >
              <PlusCircle size={18} />
            </button>
          </div>

          <button
            type="submit"
            className="flex-1 bg-black text-white rounded-xl py-3 px-6 font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg active:scale-[0.98]"
          >
            {editingItem ? 'Update Item' : (
              <>
                <Plus size={18} />
                <span>Add to List</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
