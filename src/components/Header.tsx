/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShoppingBasket } from 'lucide-react';
import { motion } from 'motion/react';

export default function Header() {
  return (
    <header className="py-8 px-4 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-2"
      >
        <div className="bg-black text-white p-2 rounded-xl">
          <ShoppingBasket size={24} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">FreshCart</h1>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-500 text-sm font-medium tracking-wide uppercase"
      >
        Your Minimal Shopping List
      </motion.p>
    </header>
  );
}
