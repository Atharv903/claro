/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Theme } from '../types';

interface MeshBackgroundProps {
  theme: Theme;
  activeColor?: string;
}

export default function MeshBackground({ theme }: MeshBackgroundProps) {
  const isDark = theme === 'dark';

  return (
    <div className="absolute inset-0 -z-50 overflow-hidden select-none pointer-events-none">
      {/* Base Matte Canvas - Premium light off-white (#f4f4f7) / dark solid charcoal-black (#09090b) */}
      <div 
        className={`absolute inset-0 transition-colors duration-700 ${
          isDark 
            ? 'bg-[#09090b]' 
            : 'bg-[#f4f4f7]'
        }`} 
      />
    </div>
  );
}
