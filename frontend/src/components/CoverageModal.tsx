import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { europeCoverage, Coverage } from '@/data/coverageData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface CoverageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CoverageModal: React.FC<CoverageModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCoverage = useMemo(() => {
    if (!searchTerm) {
      return europeCoverage;
    }
    return europeCoverage.filter(item =>
      item.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.operator.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-gray-900 text-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">Coverages</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-8 h-8">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4">
              <Input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full text-sm"
              />
            </div>

            <div className="flex-grow overflow-y-auto px-4 pb-4">
              <div className="space-y-2">
                {filteredCoverage.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-xl mr-3">{item.flag}</span>
                      <div>
                        <p className="font-semibold text-sm">{item.country}</p>
                        <p className="text-xs text-gray-400">{item.network}</p>
                      </div>
                    </div>
                    <p className="text-right text-xs text-gray-300">{item.operator}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-700 text-right">
              <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 text-sm">
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(
    modalContent,
    document.getElementById('modal-root')!
  );
};

export default CoverageModal; 