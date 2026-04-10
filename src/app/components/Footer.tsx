"use client";

import { getFamilyFullName } from '@/utils/config';

const Footer = () => {
  const familyFullName = getFamilyFullName();

  return (
    <footer className="bg-cinnabar-deep dark:bg-dark-cinnabar-deep mt-12 footer-ornament">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold leading-6 text-gold-light dark:text-dark-gold">关于族谱</h3>
            <p className="text-sm leading-6 text-dark-muted">
              {familyFullName}族谱是一个记录{familyFullName}家族历史和传承的网站，旨在保存家族记忆，传承家族文化。
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold leading-6 text-gold-light dark:text-dark-gold">传承历史</h3>
            <p className="text-sm leading-6 text-dark-muted">
              族谱是中华民族传统文化的重要组成部分，记录着家族的源流、迁徙、发展和重要人物事迹。
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-cinnabar-dark/30 dark:border-dark-cinnabar-dark/30 pt-6">
          <p className="text-xs leading-5 text-center text-dark-muted">
            &copy; 2026 {familyFullName}族谱
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
