/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Trash2, Edit2, Check, Circle, CheckCircle2 } from 'lucide-react';
import { GroceryItem } from '../types';
import { motion } from 'motion/react';

interface GroceryListItemProps {
  item: GroceryItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: GroceryItem) => void;
}

export default function GroceryListItem({ item, onToggle, onDelete, onEdit }: GroceryListItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`group bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100 shadow-sm transition-all hover:shadow-md ${
        item.is_completed ? 'opacity-60 bg-gray-50' : ''
      }`}
    >
      <button
        onClick={() => onToggle(item.id)}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          item.is_completed
            ? 'bg-black border-black text-white'
            : 'border-gray-200 hover:border-black'
        }`}
      >
        {item.is_completed && <Check size={14} strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0" onClick={() => onToggle(item.id)}>
        <div className="flex items-center gap-2">
          <h3
            className={`font-medium transition-all truncate ${
              item.is_completed ? 'text-gray-400 line-through' : 'text-gray-900'
            }`}
          >
            {item.name}
          </h3>
          {item.quantity > 1 && (
            <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
              x{item.quantity}
            </span>
          )}
        </div>
        {item.note && (
          <p className="text-sm text-gray-400 truncate mt-0.5">{item.note}</p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
          title="Edit"
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
}
